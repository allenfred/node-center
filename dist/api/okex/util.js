"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isApiServer = exports.getKlineSubChannel = exports.isTickerMsg = exports.isKlineMsg = void 0;
const types_1 = require("../../types");
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
    return `okex:candle${types_1.KlineInterval[arg.channel.toLowerCase()]}:${arg.instId}`;
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
//# sourceMappingURL=util.js.map