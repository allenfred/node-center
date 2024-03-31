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
exports.setupWsserver = void 0;
const lodash_1 = require("lodash");
const logger_1 = require("../logger");
const Binance = require("../api/binance");
const Okex = require("../api/okex");
const types_1 = require("../types");
const dao_1 = require("../dao");
const util_1 = require("./util");
const globalAny = global;
function setupSocketServer(client) {
    return __awaiter(this, void 0, void 0, function* () {
        globalAny.binanceSubscribed = [];
        globalAny.okexSubscribed = [];
        globalAny.io.on('connection', (socket) => {
            logger_1.default.info('someone connected: ' + socket.id);
            socket.on('tickers', (msg) => {
                const commands = util_1.getWsTickerCommands(msg);
                if (globalAny.okexWsConnected &&
                    lodash_1.difference(commands.okex, globalAny.okexSubscribed).length) {
                    globalAny.okexSubscribed = [
                        ...globalAny.okexSubscribed,
                        ...commands.okex,
                    ];
                    client.okex.subscribe(...commands.okex);
                }
                socket.join('tickers');
                logger_1.default.info(`socket: [${socket.id}] join default room: [tickers]`);
            });
            socket.on('klines', (msg) => {
                logger_1.default.info('[Event:klines] ' + JSON.stringify(msg));
                if (util_1.isSubscribeMsg(msg)) {
                    const { channel, payload } = util_1.getWsKlineCommand(msg);
                    socket.join('klines');
                    socket.join(util_1.getClientSubChannel(msg));
                    if (util_1.isChannel(msg, types_1.Exchange.Binance) &&
                        globalAny.binanceWsConnected &&
                        lodash_1.difference([channel], globalAny.binanceSubscribed).length) {
                        globalAny.binanceSubscribed = [
                            ...globalAny.binanceSubscribed,
                            ...lodash_1.difference([channel], globalAny.binanceSubscribed),
                        ];
                        client.binance.send(payload);
                    }
                    // ** client message schema:
                    //   {
                    //     "op": "subscribe",
                    //     "args": [{
                    //         "channel": "candle1h",
                    //         "instId": "BTC-USDT-SWAP"
                    //     }]
                    //   }
                    if (util_1.isChannel(msg, types_1.Exchange.Okex) &&
                        globalAny.okexWsConnected &&
                        lodash_1.difference([channel], globalAny.okexSubscribed).length) {
                        globalAny.okexSubscribed = [
                            ...globalAny.okexSubscribed,
                            ...lodash_1.difference([channel], globalAny.okexSubscribed),
                        ];
                        client.okex.subscribe(payload);
                    }
                }
                logger_1.default.info(`socket: [${socket.id}] join room: [${util_1.getClientSubChannel(msg)}]`);
            });
            // ** 默认每一个client只能订阅一个合约K线实时行情
            socket.on(types_1.EventName.disconnecting, () => {
                logger_1.default.info(`[disconnecting:${socket.id}] leave ${JSON.stringify([...socket.rooms].filter((room) => room.includes('USDT')))}`);
            });
            socket.on(types_1.EventName.disconnect, (reason) => {
                logger_1.default.info(`[disconnect:${socket.id}]  reason: ${reason}`);
            });
        });
    });
}
function setupWsserver() {
    return __awaiter(this, void 0, void 0, function* () {
        const binanceInstruments = yield dao_1.InstrumentInfoDao.find({
            exchange: types_1.Exchange.Binance,
        });
        const okexInstruments = yield dao_1.InstrumentInfoDao.find({
            exchange: types_1.Exchange.Okex,
        });
        const binanceWsClient = yield Binance.setupWsClient(binanceInstruments);
        const okexWsClient = yield Okex.setupWsClient(okexInstruments);
        setupSocketServer({ binance: binanceWsClient, okex: okexWsClient });
    });
}
exports.setupWsserver = setupWsserver;
//# sourceMappingURL=server.js.map