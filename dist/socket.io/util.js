"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientSubChannel = exports.isUnsubscribeMsg = exports.isSubscribeMsg = exports.getWsTickerCommands = exports.getOkexWsTickerCommands = exports.getBybitWsTickerCommands = exports.getBinanceWsTickerCommands = exports.getWsKlineCommand = exports.getBybitWsKlineCommand = exports.getOkexWsKlineCommand = exports.getBinanceWsKlineCommand = exports.isChannel = void 0;
const types_1 = require("../types");
const BINANCE_NUMBER_INTERVAL = {
    15: '15m',
    60: '1h',
    120: '2h',
    240: '4h',
    360: '6h',
    720: '12h',
    1440: '1d',
    10080: '1w',
};
const OKEX_NUMBER_INTERVAL = {
    15: '15m',
    60: '1H',
    120: '2H',
    240: '4H',
    360: '6H',
    7200: '12H',
    1440: '1D',
    10080: '1W',
};
function isChannel(msg, exchange) {
    return JSON.stringify(msg).includes(exchange);
}
exports.isChannel = isChannel;
// Binance Interval:
// 1m 3m 5m 15m 30m
// 1h 2h 4h 6h 8h 12h
// 1d 3d
function getBinanceWsKlineCommand(msg) {
    const [exchange, gran, instId] = msg.split('.');
    const channel = `${instId.toLowerCase()}@kline_${BINANCE_NUMBER_INTERVAL[gran]}`;
    return {
        channel,
        payload: JSON.stringify({
            method: types_1.Method.subscribe.toUpperCase(),
            params: [
                `${instId.toLowerCase()}@kline_${BINANCE_NUMBER_INTERVAL[gran]}`,
            ],
            id: new Date().getTime(),
        }),
    };
}
exports.getBinanceWsKlineCommand = getBinanceWsKlineCommand;
// Okex Interval:
// candle1D candle2D candle3D candle5D
// candle12H candle6H candle4H candle2H candle1H
// candle30m candle15m candle5m candle3m candle1m
function getOkexWsKlineCommand(msg) {
    const [exchange, interval, instId] = msg.split('.');
    const channel = `candle${OKEX_NUMBER_INTERVAL[interval]}`;
    return {
        channel,
        payload: { channel, instId },
    };
}
exports.getOkexWsKlineCommand = getOkexWsKlineCommand;
// Bybit Interval:
// 1 3 5 15 30
// 60 120 240 360 720
// D W M
function getBybitWsKlineCommand(msg) {
    const [exchange, interval, instId] = msg.split('.');
    const channel = `candle.${interval}.${instId.toUpperCase()}`;
    return {
        channel,
        payload: channel,
    };
}
exports.getBybitWsKlineCommand = getBybitWsKlineCommand;
function getWsKlineCommand(msg) {
    try {
        const channel = getClientSubChannel(msg);
        if (channel.startsWith('binance')) {
            return getBinanceWsKlineCommand(channel);
        }
        if (channel.startsWith('okex')) {
            return getOkexWsKlineCommand(channel);
        }
        if (channel.startsWith('bybit')) {
            return getBybitWsKlineCommand(channel);
        }
    }
    catch (e) {
        return {};
    }
}
exports.getWsKlineCommand = getWsKlineCommand;
function getBinanceWsTickerCommands(msg) {
    try {
        const { args: channnels } = msg;
        const params = channnels
            .filter((channel) => channel.startsWith('binance'))
            .map((channel) => {
            const parts = channel.split('.');
            return parts[1].toLowerCase() + '@ticker';
        });
        if (params.length) {
            return JSON.stringify({
                method: types_1.Method.subscribe.toUpperCase(),
                params,
                id: new Date().getTime(),
            });
        }
        return null;
    }
    catch (e) {
        return null;
    }
}
exports.getBinanceWsTickerCommands = getBinanceWsTickerCommands;
// ws.send('{"op": "subscribe", "args": ["instrument_info.100ms.BTCUSDT"]}')
function getBybitWsTickerCommands(msg) {
    try {
        const { args: channnels } = msg;
        return channnels
            .filter((channel) => channel.startsWith('bybit'))
            .map((channel) => {
            const parts = channel.split('.');
            return `instrument_info.100ms.${parts[1].toUpperCase()}`;
        });
    }
    catch (e) {
        return null;
    }
}
exports.getBybitWsTickerCommands = getBybitWsTickerCommands;
// {
//   "op": "subscribe",
//   "args": [{
//       "channel": "tickers",
//       "instId": "LTC-USD-200327"
//   }]
// }
function getOkexWsTickerCommands(msg) {
    try {
        const { args: channnels } = msg;
        return channnels
            .filter((channel) => channel.startsWith('okex'))
            .map((channel) => {
            const parts = channel.split('.');
            return {
                channel: 'tickers',
                instId: parts[1].toUpperCase(),
            };
        });
    }
    catch (e) {
        return null;
    }
}
exports.getOkexWsTickerCommands = getOkexWsTickerCommands;
function getWsTickerCommands(msg) {
    try {
        return {
            binance: getBinanceWsTickerCommands(msg),
            okex: getOkexWsTickerCommands(msg),
            bybit: getBybitWsTickerCommands(msg),
        };
    }
    catch (e) {
        return {};
    }
}
exports.getWsTickerCommands = getWsTickerCommands;
function isSubscribeMsg({ op }) {
    try {
        return op === types_1.Method.subscribe;
    }
    catch (e) {
        return false;
    }
}
exports.isSubscribeMsg = isSubscribeMsg;
function isUnsubscribeMsg({ op }) {
    try {
        return op === types_1.Method.unsubscribe;
    }
    catch (e) {
        return false;
    }
}
exports.isUnsubscribeMsg = isUnsubscribeMsg;
function getClientSubChannel(msg) {
    try {
        const { args } = msg;
        return args[0];
    }
    catch (e) {
        return '';
    }
}
exports.getClientSubChannel = getClientSubChannel;
//# sourceMappingURL=util.js.map