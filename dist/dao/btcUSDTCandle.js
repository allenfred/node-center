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
            const existedCandle = yield models_1.btcUSDTCandle.findOne(uniqueCondition);
            if (existedCandle) {
                return yield models_1.btcUSDTCandle.updateOne(uniqueCondition, candle);
            }
            else {
                return yield models_1.btcUSDTCandle.create(candle);
            }
        }));
    });
}
const BtcUSDTCandleDao = {
    upsert
};
exports.BtcUSDTCandleDao = BtcUSDTCandleDao;
//# sourceMappingURL=btcUSDTCandle.js.map