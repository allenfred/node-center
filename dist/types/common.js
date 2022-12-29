"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadyState = exports.Exchange = exports.KlineInterval = void 0;
var KlineInterval;
(function (KlineInterval) {
    KlineInterval[KlineInterval["candle1w"] = 10080] = "candle1w";
    KlineInterval[KlineInterval["candle1d"] = 1440] = "candle1d";
    KlineInterval[KlineInterval["candle12h"] = 720] = "candle12h";
    KlineInterval[KlineInterval["candle6h"] = 360] = "candle6h";
    KlineInterval[KlineInterval["candle4h"] = 240] = "candle4h";
    KlineInterval[KlineInterval["candle2h"] = 120] = "candle2h";
    KlineInterval[KlineInterval["candle1h"] = 60] = "candle1h";
    KlineInterval[KlineInterval["candle30m"] = 30] = "candle30m";
    KlineInterval[KlineInterval["candle15m"] = 15] = "candle15m";
    KlineInterval[KlineInterval["candle5m"] = 5] = "candle5m";
})(KlineInterval = exports.KlineInterval || (exports.KlineInterval = {}));
var Exchange;
(function (Exchange) {
    Exchange["Okex"] = "okex";
    Exchange["Binance"] = "binance";
    Exchange["Bybit"] = "bybit";
})(Exchange = exports.Exchange || (exports.Exchange = {}));
var ReadyState;
(function (ReadyState) {
    ReadyState[ReadyState["CONNECTING"] = 0] = "CONNECTING";
    ReadyState[ReadyState["OPEN"] = 1] = "OPEN";
    ReadyState[ReadyState["CLOSING"] = 2] = "CLOSING";
    ReadyState[ReadyState["CLOSED"] = 3] = "CLOSED";
})(ReadyState = exports.ReadyState || (exports.ReadyState = {}));
//# sourceMappingURL=common.js.map