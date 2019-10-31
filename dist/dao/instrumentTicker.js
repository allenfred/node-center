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
function upsert(tickers) {
    return __awaiter(this, void 0, void 0, function* () {
        return bluebird.map(tickers, (ticker) => __awaiter(this, void 0, void 0, function* () {
            let result;
            const { instrument_id } = ticker;
            const one = yield models_1.InstrumentTicker.findOne({
                instrument_id,
            });
            if (one) {
                result = yield models_1.InstrumentTicker.updateOne({ instrument_id }, ticker);
            }
            else {
                result = yield models_1.InstrumentTicker.create(ticker);
            }
            return result;
        }));
    });
}
const InstrumentTickerDao = {
    upsert,
};
exports.InstrumentTickerDao = InstrumentTickerDao;
//# sourceMappingURL=instrumentTicker.js.map