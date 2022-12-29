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
exports.handleMsg = exports.handleKlines = exports.handleTickers = exports.isApiServer = exports.getKlineSubChannel = exports.isTickerMsg = exports.isKlineMsg = void 0;
const types_1 = require("../../types");
const dao_1 = require("../../dao");
function isKlineMsg(message) {
    if (message && message.arg && message.arg.channel.includes('candle')) {
        return true;
    }
    return false;
}
exports.isKlineMsg = isKlineMsg;
function isTickerMsg(message) {
    if (message && message.arg && message.arg.channel === 'tickers') {
        return true;
    }
    return false;
}
exports.isTickerMsg = isTickerMsg;
function getKlineSubChannel(arg) {
    return `okex.${types_1.KlineInterval[arg.channel.toLowerCase()]}.${arg.instId}`;
}
exports.getKlineSubChannel = getKlineSubChannel;
function isApiServer(req) {
    try {
        return req && req.socket.remoteAddress == '121.4.15.211';
    }
    catch (e) {
        return false;
    }
}
exports.isApiServer = isApiServer;
function handleTickers(message) {
    return __awaiter(this, void 0, void 0, function* () {
        yield dao_1.InstrumentInfoDao.upsert(message.data
            .filter((i) => i.instId.indexOf('USDT') !== -1)
            .map((i) => {
            return {
                instrument_id: i.instId,
                last: i.last,
                chg_24h: i.last - i.open24h,
                chg_rate_24h: (((i.last - i.open24h) * 100) / i.open24h).toFixed(4),
                high_24h: i.high24h,
                low_24h: i.low24h,
                volume_24h: i.vol24h,
                timestamp: i.ts,
                open_interest: '0',
                open_24h: i.open24h,
                volume_token_24h: i.volCcy24h,
                exchange: types_1.Exchange.Okex,
            };
        }));
    });
}
exports.handleTickers = handleTickers;
function handleKlines(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const granularity = types_1.KlineInterval[message.arg.channel.toLowerCase()];
        const instrumentId = message.arg.instId;
        const klines = message.data.map((kline) => {
            return {
                instrument_id: instrumentId,
                underlying_index: instrumentId.split('-')[0],
                quote_currency: instrumentId.split('-')[1],
                timestamp: new Date(+kline[0]),
                open: +kline[1],
                high: +kline[2],
                low: +kline[3],
                close: +kline[4],
                volume: +kline[5],
                currency_volume: +kline[6],
                granularity: +granularity,
                exchange: types_1.Exchange.Okex,
            };
        });
        yield dao_1.InstrumentKlineDao.upsertOne(klines[0]);
    });
}
exports.handleKlines = handleKlines;
function handleMsg(message) {
    return __awaiter(this, void 0, void 0, function* () {
        // 每15min更新一次Ticker
        // if (
        //   isTickerMsg(message) &&
        //   new Date().getMinutes() % 10 === 0 &&
        //   new Date().getSeconds() < 30
        // ) {
        //   handleTickers(message);
        // }
        //  每30秒 更新K线数据
        if (new Date().getSeconds() % 30 === 0 && isKlineMsg(message)) {
            handleKlines(message);
        }
    });
}
exports.handleMsg = handleMsg;
//# sourceMappingURL=util.js.map