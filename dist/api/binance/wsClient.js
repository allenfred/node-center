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
exports.setupWsClient = exports.broadCastTickers = exports.broadCastKlines = void 0;
const { Spot } = require('@binance/connector');
const types_1 = require("../../types");
const logger_1 = require("../../logger");
const util_1 = require("./util");
// #TODO: handleMessage update to Redis
const globalAny = global;
const API_KEY = 'MxUyyavVFOC2aWYZLtAG9hQkq9s4rpQAyvlND19gqqIG5iCyDJ15wtrLZhqbjBkT';
const SECRET_KEY = 'I6eTFNu3YAFOiiWLm2XO27wFxkqjSfPls6OtRL83DZXaMbAkUlo6zSKpuSmC19pX';
// const host = 'wss://fstream.binance.com';
const wshost = 'wss://fstream.binance.com';
const client = new Spot('', '', {
    baseURL: 'wss://fstream.binance.com',
    wsURL: wshost,
});
function broadCastKlines(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (util_1.isKlineMsg(msg)) {
            const interval = msg.k.i; // 1h
            const instId = msg.s;
            const subChannel = util_1.getKlineSubChannel(interval, instId.toUpperCase());
            const k = msg.k;
            const pubMsg = JSON.stringify({
                channel: subChannel,
                data: [k.t, k.o, k.h, k.l, k.c, k.v, k.q],
            });
            globalAny.io.to('klines').emit(subChannel, pubMsg);
        }
    });
}
exports.broadCastKlines = broadCastKlines;
function broadCastTickers(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        let pubMsg;
        if (msg.length) {
            pubMsg = JSON.stringify({
                channel: 'tickers',
                data: msg
                    .filter((i) => i.s.endsWith('USDT'))
                    .map((i) => {
                    // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
                    return [
                        types_1.Exchange.Binance,
                        i.s,
                        i.c,
                        +i.c - +i.o,
                        (((+i.c - +i.o) * 100) / +i.o).toFixed(4),
                        i.q,
                    ];
                }),
            });
        }
        else {
            const i = msg;
            pubMsg = JSON.stringify({
                channel: 'tickers',
                data: [
                    types_1.Exchange.Binance,
                    i.s,
                    i.c,
                    +i.c - +i.o,
                    (((+i.c - +i.o) * 100) / +i.o).toFixed(4),
                    i.q,
                ],
            });
        }
        globalAny.io.to('tickers').emit('tickers', pubMsg);
    });
}
exports.broadCastTickers = broadCastTickers;
function setupWsClient(instruments) {
    return __awaiter(this, void 0, void 0, function* () {
        const subStr = instruments.reduce((acc, { instrument_id }) => {
            const instId = instrument_id.toLowerCase();
            return [
                ...acc,
                `${instId}@kline_15m`,
                `${instId}@kline_1h`,
                `${instId}@kline_4h`,
                `${instId}@kline_1d`,
            ];
        }, []);
        const subUrl = `${wshost}/ws/!miniTicker@arr/${subStr.join('/')}`;
        const wsRef = client.subscribe(subUrl, {
            open: () => {
                logger_1.default.info('!!! 与Binance wsserver建立连接成功 !!!');
                globalAny.binanceWsConnected = true;
            },
            close: () => {
                logger_1.default.error('!!! 与Binance wsserver断开连接 !!!');
            },
            message: (data) => {
                const msg = JSON.parse(data);
                if (util_1.isKlineMsg(msg)) {
                    broadCastKlines(msg);
                }
                if (util_1.isTickerMsg(data)) {
                    broadCastTickers(msg);
                }
                util_1.handleMsg(JSON.parse(data));
            },
        });
        return wsRef.ws;
    });
}
exports.setupWsClient = setupWsClient;
//# sourceMappingURL=wsClient.js.map