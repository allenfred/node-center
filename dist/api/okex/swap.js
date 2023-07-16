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
exports.getHistoryKlines = exports.initInstruments = void 0;
const bluebird = require("bluebird");
const _ = require("lodash");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const dao_1 = require("../../dao");
const models_1 = require("../../database/models");
const client_1 = require("./client");
const common_1 = require("./../common");
const util_1 = require("../../util");
function initInstruments() {
    return __awaiter(this, void 0, void 0, function* () {
        //获取全量永续合约信息
        let instruments = yield client_1.getInstruments();
        // BTC合约及其他USDT本位合约
        instruments = instruments.filter((i) => i.instrument_id.endsWith('USDT-SWAP'));
        logger_1.default.info(`Okx[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`);
        if (!instruments.length) {
            return;
        }
        // ****** 处理下架合约 ******
        const oldInsts = yield dao_1.InstrumentInfoDao.find({
            exchange: types_1.Exchange.Okex,
        });
        const invalidInsts = _.differenceBy(oldInsts, instruments, 'instrument_id');
        if (invalidInsts.length) {
            logger_1.default.info(_.map(invalidInsts, 'instrument_id'));
            yield dao_1.InstrumentInfoDao.deleteByIds(_.map(invalidInsts, 'instrument_id'), types_1.Exchange.Okex).then((result) => {
                if (result.ok === 1) {
                    logger_1.default.info(`Okx[永续合约] - 删除下架合约，共: ${result.deletedCount} 条 ...`);
                }
            });
        }
        // *************************
        //更新永续合约信息
        yield dao_1.InstrumentInfoDao.upsert(instruments.map((i) => {
            return Object.assign(i, { tick_size: +i.tick_size });
        }));
        let data = yield dao_1.InstrumentInfoDao.find({ exchange: types_1.Exchange.Okex });
        // data = data.filter((i: Instrument) => i.klines !== 1);
        logger_1.default.info(`Okex[永续合约] - 待初始化K线的合约数量 ${data.length} ...`);
        return _.sortBy(data, ['instrument_id']);
    });
}
exports.initInstruments = initInstruments;
// 获取最多过去 1500 条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
function getReqOptions(instId, opts = {}) {
    const instrumentId = instId;
    const count = opts.count || 300;
    let reqOptions = [];
    for (let i = 0; i < 1; i++) {
        reqOptions.push({
            instrument_id: instrumentId,
            start: util_1.getTimestamp((i + 1) * 15 * -count, 'm'),
            end: util_1.getTimestamp(i * 15 * -count, 'm'),
            granularity: 900,
        });
        reqOptions.push({
            instrument_id: instrumentId,
            start: util_1.getTimestamp((i + 1) * -count, 'h'),
            end: util_1.getTimestamp(i * -count, 'h'),
            granularity: 3600,
        });
        reqOptions.push({
            instrument_id: instrumentId,
            start: util_1.getTimestamp((i + 1) * 4 * -count, 'h'),
            end: util_1.getTimestamp(i * 4 * -count, 'h'),
            granularity: 14400,
        });
        reqOptions.push({
            instrument_id: instrumentId,
            start: util_1.getTimestamp((i + 1) * 24 * -count, 'h'),
            end: util_1.getTimestamp(i * 24 * -count, 'h'),
            granularity: 86400,
        });
        if (instrumentId.indexOf('BTC') !== -1) {
            reqOptions.push({
                instrument_id: instrumentId,
                start: util_1.getTimestamp((i + 1) * 30 * -count, 'm'),
                end: util_1.getTimestamp(i * 30 * -count, 'm'),
                granularity: 1800,
            });
            reqOptions.push({
                instrument_id: instrumentId,
                start: util_1.getTimestamp((i + 1) * 2 * -count, 'h'),
                end: util_1.getTimestamp(i * 2 * -count, 'h'),
                granularity: 7200,
            });
            reqOptions.push({
                instrument_id: instrumentId,
                start: util_1.getTimestamp((i + 1) * 6 * -count, 'h'),
                end: util_1.getTimestamp(i * 6 * -count, 'h'),
                granularity: 21600,
            });
            reqOptions.push({
                instrument_id: instrumentId,
                start: util_1.getTimestamp((i + 1) * 12 * -count, 'h'),
                end: util_1.getTimestamp(i * 12 * -count, 'h'),
                granularity: 43200,
            });
        }
    }
    if (opts && opts.includeInterval && opts.includeInterval.length) {
        reqOptions = reqOptions.filter((i) => opts.includeInterval.includes(i.granularity));
    }
    if (opts && opts.includeInst && opts.includeInst.length) {
        reqOptions = reqOptions.filter((i) => opts.includeInst.includes(i.instrument_id));
    }
    return reqOptions;
}
function getHistoryKlines(instruments, options) {
    return __awaiter(this, void 0, void 0, function* () {
        //获取所有时间粒度请求参数 如[60/180/300 900/1800/3600/7200/14400/21600/43200/86400]
        let opts = options || {};
        if (!opts.count) {
            opts = Object.assign(opts, { count: 300 });
        }
        const delayMillseconds = opts && opts.delay ? opts.delay : 100;
        return bluebird.each(instruments, ({ instrument_id }) => {
            //设置系统限速规则 (okx官方API 限速规则：40次/2s)
            return bluebird
                .delay(delayMillseconds)
                .then(() => {
                return common_1.getOkexKlines(getReqOptions(instrument_id, opts).map((opt) => {
                    return Object.assign({}, opt, { exchange: types_1.Exchange.Okex });
                }), options.updateFunc || dao_1.InstrumentKlineDao.upsertMany);
            })
                .then(() => {
                return models_1.InstrumentInfo.updateOne({ exchange: types_1.Exchange.Okex, instrument_id }, { klines: 1 });
            })
                .then(() => {
                return;
            });
        });
    });
}
exports.getHistoryKlines = getHistoryKlines;
//# sourceMappingURL=swap.js.map