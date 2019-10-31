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
const common = require("../okex/common");
const dao_1 = require("../dao");
const util_1 = require("../util");
function handleFutureInstruments(wss, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield dao_1.InstrumentInfoDao.upsert(data);
        wss.subscribe(...common.getFuturesSubCommands(data));
    });
}
exports.handleFutureInstruments = handleFutureInstruments;
function handleTicker(data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield dao_1.InstrumentTickerDao.upsert(data);
    });
}
exports.handleTicker = handleTicker;
function handleCandles(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const timePeriod = getNumber(message.table);
        const candles = message.data.map((item) => {
            return {
                instrument_id: item.instrument_id,
                underlying_index: item.instrument_id.split('-')[0],
                quote_currency: item.instrument_id.split('-')[1],
                timestamp: new Date(item.candle[0]),
                open: +item.candle[1],
                high: +item.candle[2],
                low: +item.candle[3],
                close: +item.candle[4],
                volume: +item.candle[5],
                currency_volume: +item.candle[6],
                alias: util_1.getInstrumentAlias(item.instrument_id),
                granularity: +timePeriod,
            };
        });
        yield dao_1.InstrumentCandleDao.upsert(candles);
    });
}
exports.handleCandles = handleCandles;
function getNumber(str) {
    return str.match(/\d+/)[0];
}
exports.getNumber = getNumber;
//# sourceMappingURL=index.js.map