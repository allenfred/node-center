"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KlineInterval = exports.OkxWsChannel = exports.OkxInstType = exports.OkxBusiness = void 0;
var OkxBusiness;
(function (OkxBusiness) {
    OkxBusiness["FUTURES"] = "futures";
    OkxBusiness["SWAP"] = "swap";
})(OkxBusiness = exports.OkxBusiness || (exports.OkxBusiness = {}));
var OkxInstType;
(function (OkxInstType) {
    OkxInstType["SPOT"] = "SPOT";
    OkxInstType["SWAP"] = "SWAP";
    OkxInstType["FUTURES"] = "FUTURES";
    OkxInstType["OPTION"] = "OPTION";
})(OkxInstType = exports.OkxInstType || (exports.OkxInstType = {}));
var OkxWsChannel;
(function (OkxWsChannel) {
    OkxWsChannel["Instrument"] = "instruments";
    OkxWsChannel["Ticker"] = "tickers";
    OkxWsChannel["OpenInterest"] = "open-interest";
    OkxWsChannel["Trade"] = "trades";
    OkxWsChannel["FundingRate"] = "funding-rate";
})(OkxWsChannel = exports.OkxWsChannel || (exports.OkxWsChannel = {}));
var KlineInterval;
(function (KlineInterval) {
    KlineInterval[KlineInterval["candle1w"] = 604800] = "candle1w";
    KlineInterval[KlineInterval["candle1d"] = 86400] = "candle1d";
    KlineInterval[KlineInterval["candle12h"] = 43200] = "candle12h";
    KlineInterval[KlineInterval["candle6h"] = 21600] = "candle6h";
    KlineInterval[KlineInterval["candle4h"] = 14400] = "candle4h";
    KlineInterval[KlineInterval["candle2h"] = 7200] = "candle2h";
    KlineInterval[KlineInterval["candle1h"] = 3600] = "candle1h";
    KlineInterval[KlineInterval["candle30m"] = 1800] = "candle30m";
    KlineInterval[KlineInterval["candle15m"] = 900] = "candle15m";
    KlineInterval[KlineInterval["candle5m"] = 300] = "candle5m";
})(KlineInterval = exports.KlineInterval || (exports.KlineInterval = {}));
//# sourceMappingURL=okex.js.map