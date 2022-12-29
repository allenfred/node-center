"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OkxWsChannel = exports.OkxInstType = exports.OkxBusiness = void 0;
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
//# sourceMappingURL=okex.js.map