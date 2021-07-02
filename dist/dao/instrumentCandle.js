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
const bluebird = require("bluebird");
const models_1 = require("../database/models");
const logger_1 = require("../logger");
function upsert(candles) {
    return __awaiter(this, void 0, void 0, function* () {
        return bluebird.map(candles, (candle) => __awaiter(this, void 0, void 0, function* () {
            //find unique candle by underlying_index & timestamp & alias & granularity
            const uniqueCondition = {
                instrument_id: candle.instrument_id,
                timestamp: new Date(candle.timestamp),
                granularity: candle.granularity,
            };
            const Model = getModel(candle);
            const existedCandle = yield Model.findOne(uniqueCondition);
            if (existedCandle) {
                return yield Model.updateOne(uniqueCondition, candle).catch((err) => {
                    logger_1.default.error(`update candle: ${candle}`, err);
                });
            }
            else {
                return yield Model.create(candle).catch((err) => {
                    logger_1.default.error(`create candle: ${candle}`, err);
                });
            }
        }));
    });
}
function getModel(candle) {
    const swapModels = {
        BTC: models_1.BtcSwapCandle,
    };
    if (candle.instrument_id.includes('SWAP')) {
        return swapModels[candle.underlying_index];
    }
}
const InstrumentCandleDao = {
    upsert,
};
exports.InstrumentCandleDao = InstrumentCandleDao;
//# sourceMappingURL=instrumentCandle.js.map