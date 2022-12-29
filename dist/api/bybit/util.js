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
exports.getFormattedKlineSubChannel = exports.handleKlines = exports.isTickerMsg = exports.isKlineMsg = void 0;
const dao_1 = require("../../dao");
const types_1 = require("../../types");
function isKlineMsg(msg) {
    return msg.topic.includes('candle');
}
exports.isKlineMsg = isKlineMsg;
function isTickerMsg(msg) {
    return msg.topic.includes('instrument_info');
}
exports.isTickerMsg = isTickerMsg;
function handleKlines(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const splitStr = msg.topic.split('.');
        const symbol = splitStr[2];
        const k = msg.data[0];
        yield dao_1.InstrumentKlineDao.upsertOne({
            instrument_id: symbol,
            underlying_index: symbol.replace('USDT', ''),
            quote_currency: 'USDT',
            timestamp: k.start,
            open: +k.open,
            high: +k.high,
            low: +k.low,
            close: +k.close,
            volume: +k.volume,
            currency_volume: +k.turnover,
            granularity: +splitStr[1] * 60,
            exchange: types_1.Exchange.Bybit,
        });
    });
}
exports.handleKlines = handleKlines;
function getFormattedKlineSubChannel({ topic }) {
    if (topic.includes('candle')) {
        const strArr = topic.split('.');
        const interval = strArr[1] && +strArr[1] < 60
            ? strArr[1] + 'm'
            : Math.round(+strArr[1] / 60) + 'h';
        const instId = strArr[2];
        return `bybit.${types_1.KlineInterval['candle' + interval]}.${instId}`;
    }
}
exports.getFormattedKlineSubChannel = getFormattedKlineSubChannel;
//# sourceMappingURL=util.js.map