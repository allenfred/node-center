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
function upsert(candles) {
    return __awaiter(this, void 0, void 0, function* () {
        return bluebird.map(candles, (candle) => __awaiter(this, void 0, void 0, function* () {
            //find unique candle by underlying_index & timestamp & alias & granularity
            const uniqueCondition = {
                timestamp: new Date(candle.timestamp),
                granularity: candle.granularity
            };
            const Model = getModel(candle);
            const existedCandle = yield models_1.InstrumentCandle.findOne(uniqueCondition);
            if (existedCandle) {
                return yield Model.updateOne(uniqueCondition, candle);
            }
            else {
                return yield Model.create(candle);
            }
        }));
    });
}
function getModel(candle) {
    const swapModels = {
        BTC: models_1.BtcSwapCandle,
        LTC: models_1.LtcSwapCandle,
        EOS: models_1.EosSwapCandle,
        ETH: models_1.EthSwapCandle,
        BSV: models_1.BsvSwapCandle,
        BCH: models_1.BchSwapCandle
    };
    const futureModels = {
        BTC: models_1.BtcFutureCandle,
        LTC: models_1.LtcFutureCandle,
        EOS: models_1.EosFutureCandle,
        ETH: models_1.EthFutureCandle,
        BSV: models_1.BsvFutureCandle,
        BCH: models_1.BchFutureCandle
    };
    if (candle.instrument_id.includes("SWAP")) {
        return swapModels[candle.underlying_index];
    }
    else {
        return futureModels[candle.underlying_index];
    }
}
const InstrumentCandleDao = {
    upsert
};
exports.InstrumentCandleDao = InstrumentCandleDao;
//# sourceMappingURL=instrumentCandle.js.map