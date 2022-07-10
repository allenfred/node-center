"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrumentKlineDao = void 0;
const bluebird = require("bluebird");
const models_1 = require("../database/models");
const logger_1 = require("../logger");
const _ = require("lodash");
// for common update jobs
function upsert(klines) {
    return __awaiter(this, void 0, void 0, function* () {
        return bluebird.map(klines, (kline) => __awaiter(this, void 0, void 0, function* () {
            //find unique kline by underlying_index & timestamp & alias & granularity & exchange
            const uniqueCondition = {
                instrument_id: kline.instrument_id,
                timestamp: new Date(kline.timestamp),
                granularity: kline.granularity,
                exchange: kline.exchange,
            };
            yield models_1.UsdtSwapKline.updateOne(uniqueCondition, kline, {
                upsert: true,
            }).catch((err) => {
                logger_1.default.error(`[UpdateKline:${kline.exchange}/${kline.instrument_id}/${kline.granularity}] CatchError: ${err.stack.substring(0, 100)}`);
            });
        }), { concurrency: 5 });
    });
}
// for daily cron jobs
function upsertMany(opts, klines) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!klines.length) {
            return;
        }
        const filter = Object.assign(opts, {
            timestamp: { $in: _.map(klines, 'timestamp') },
        });
        const data = yield models_1.UsdtSwapKline.find(filter, 'timestamp', {
            limit: klines.length,
            sort: { timestamp: 1 },
        }).exec();
        const insertNeeded = klines.filter((kline) => {
            const res = _.find(data, (o) => {
                return (new Date(o.timestamp).valueOf() === new Date(kline.timestamp).valueOf());
            });
            return !res;
        });
        const updateNeeded = klines.filter((kline) => {
            const res = _.find(data, (o) => {
                return (new Date(o.timestamp).valueOf() ===
                    new Date(kline.timestamp).valueOf() &&
                    (kline.open !== o.open ||
                        kline.high !== o.high ||
                        kline.low !== o.low ||
                        kline.close !== o.close));
            });
            return !res;
        });
        if (insertNeeded.length) {
            logger_1.default.info(`[${klines[0].exchange}/${opts.instrument_id}/${klines[0].granularity}] 新增K线 ${insertNeeded.length} 条.`);
            return models_1.UsdtSwapKline.insertMany(insertNeeded, {
                ordered: false,
                lean: true,
            });
        }
        if (updateNeeded.length) {
            logger_1.default.info(`[${klines[0].exchange}/${opts.instrument_id}/${klines[0].granularity}] 更新K线 ${updateNeeded.length} 条.`);
            return upsert(updateNeeded);
        }
        logger_1.default.info(`[${klines[0].exchange}/${opts.instrument_id}/${klines[0].granularity}] 无需更新.`);
    });
}
// for init jobs
function reinsertMany(opts, klines) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!klines.length) {
            return;
        }
        if (klines.length <= 30) {
            return upsert(klines);
        }
        const filter = Object.assign(opts, {
            timestamp: { $in: _.map(klines, 'timestamp') },
        });
        yield models_1.UsdtSwapKline.deleteMany(filter);
        return models_1.UsdtSwapKline.insertMany(klines, { ordered: false, lean: true }).catch((err) => {
            logger_1.default.error(err.message);
        });
    });
}
// for ws message jobs
function upsertOne(kline) {
    return __awaiter(this, void 0, void 0, function* () {
        //find unique kline by underlying_index & timestamp & alias & granularity & exchange
        const uniqueCondition = {
            instrument_id: kline.instrument_id,
            timestamp: new Date(kline.timestamp),
            granularity: kline.granularity,
            exchange: kline.exchange,
        };
        yield models_1.UsdtSwapKline.updateOne(uniqueCondition, kline, { upsert: true }).catch((err) => {
            logger_1.default.error(`update kline `, err);
        });
    });
}
const InstrumentKlineDao = {
    upsertOne,
    upsert,
    upsertMany,
    reinsertMany,
};
exports.InstrumentKlineDao = InstrumentKlineDao;
//# sourceMappingURL=instrumentKline.js.map