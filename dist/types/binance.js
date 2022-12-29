"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceKlineInterval = exports.FilterType = exports.BinanceWsStream = void 0;
// stream名称中所有交易对均为小写
// !miniTicker@arr 全市场的精简Ticker
// !ticker@arr 全市场的完整Ticker
var BinanceWsStream;
(function (BinanceWsStream) {
    BinanceWsStream["miniTicker"] = "!miniTicker@arr";
    BinanceWsStream["ticker"] = "!ticker@arr";
})(BinanceWsStream = exports.BinanceWsStream || (exports.BinanceWsStream = {}));
var FilterType;
(function (FilterType) {
    FilterType["PRICE_FILTER"] = "PRICE_FILTER";
    FilterType["LOT_SIZE"] = "LOT_SIZE";
    FilterType["MARKET_LOT_SIZE"] = "MARKET_LOT_SIZE";
    FilterType["MAX_NUM_ORDERS"] = "MAX_NUM_ORDERS";
    FilterType["MAX_NUM_ALGO_ORDERS"] = "MAX_NUM_ALGO_ORDERS";
    FilterType["MIN_NOTIONAL"] = "MIN_NOTIONAL";
    FilterType["PERCENT_PRICE"] = "PERCENT_PRICE";
})(FilterType = exports.FilterType || (exports.FilterType = {}));
// Binance Interval:
// 1m 3m 5m 15m 30m
// 1h 2h 4h 6h 8h 12h
// 1d 3d
var BinanceKlineInterval;
(function (BinanceKlineInterval) {
    BinanceKlineInterval[BinanceKlineInterval["candle1w"] = 10080] = "candle1w";
    BinanceKlineInterval[BinanceKlineInterval["candle1d"] = 1440] = "candle1d";
    BinanceKlineInterval[BinanceKlineInterval["candle12h"] = 720] = "candle12h";
    BinanceKlineInterval[BinanceKlineInterval["candle6h"] = 360] = "candle6h";
    BinanceKlineInterval[BinanceKlineInterval["candle4h"] = 240] = "candle4h";
    BinanceKlineInterval[BinanceKlineInterval["candle2h"] = 120] = "candle2h";
    BinanceKlineInterval[BinanceKlineInterval["candle1h"] = 60] = "candle1h";
    BinanceKlineInterval[BinanceKlineInterval["candle30m"] = 30] = "candle30m";
    BinanceKlineInterval[BinanceKlineInterval["candle15m"] = 15] = "candle15m";
    BinanceKlineInterval[BinanceKlineInterval["candle5m"] = 5] = "candle5m";
})(BinanceKlineInterval = exports.BinanceKlineInterval || (exports.BinanceKlineInterval = {}));
//# sourceMappingURL=binance.js.map