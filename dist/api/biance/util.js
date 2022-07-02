"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKlineSubChannel = exports.isKlineFinish = exports.isKlineMsg = exports.isTickerMsg = void 0;
const types_1 = require("../../types");
function isTickerMsg(message) {
    if (message &&
        (message.stream === '!ticker@arr' || message.stream === '!miniTicker@arr')) {
        return true;
    }
    return false;
}
exports.isTickerMsg = isTickerMsg;
function isKlineMsg(message) {
    if (message && message.stream.indexOf('@kline') !== -1) {
        return true;
    }
    return false;
}
exports.isKlineMsg = isKlineMsg;
function isKlineFinish(message) {
    if (message.data.k.x) {
        return true;
    }
    return false;
}
exports.isKlineFinish = isKlineFinish;
function getKlineSubChannel(interval, instId) {
    return `biance:candle${types_1.KlineInterval['candle' + interval]}:${instId}`;
}
exports.getKlineSubChannel = getKlineSubChannel;
//# sourceMappingURL=util.js.map