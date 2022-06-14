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
exports.InstrumentTickerDao = void 0;
const bluebird = require("bluebird");
const models_1 = require("../database/models");
const logger_1 = require("../logger");
function upsert(tickers) {
    return __awaiter(this, void 0, void 0, function* () {
        return bluebird.map(tickers, (ticker) => __awaiter(this, void 0, void 0, function* () {
            let result;
            const { instrument_id, exchange } = ticker;
            const one = yield models_1.InstrumentTicker.findOne({
                instrument_id,
                exchange,
            });
            try {
                if (one) {
                    result = yield models_1.InstrumentTicker.updateOne({ instrument_id, exchange }, ticker);
                }
                else {
                    result = yield models_1.InstrumentTicker.create(ticker);
                }
            }
            catch (e) {
                logger_1.default.error('upsertTicker catch error: ' + instrument_id);
            }
            return result;
        }), { concurrency: 30 });
    });
}
function findByTopVolume(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield models_1.InstrumentTicker.find({ exchange: opts.exchange }, null, {
            limit: opts.limit || 30,
            sort: { volume_24h: -1 },
        }).exec();
    });
}
function find(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield models_1.InstrumentTicker.find(opts);
    });
}
function deleteByIds(instIds) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield models_1.InstrumentTicker.deleteMany({ instrument_id: { $in: instIds } });
    });
}
const InstrumentTickerDao = {
    upsert,
    findByTopVolume,
    find,
    deleteByIds,
};
exports.InstrumentTickerDao = InstrumentTickerDao;
//# sourceMappingURL=instrumentTicker.js.map