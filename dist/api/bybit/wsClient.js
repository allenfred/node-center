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
exports.setupWsClient = void 0;
const { LinearClient } = require('bybit-api');
const bybit_api_1 = require("bybit-api");
const types_1 = require("../../types");
const logger_1 = require("../../logger");
const dao_1 = require("../../dao");
const util_1 = require("./util");
const API_KEY = 'iS12CdTOC1SmCs5kQ0';
const PRIVATE_KEY = 'Vz2L9UokimS6bz5ePwTHzWhcUXkd1qlul3MI';
const useLivenet = true;
const globalAny = global;
const client = new LinearClient(API_KEY, PRIVATE_KEY, 
// optional, uses testnet by default. Set to 'true' to use livenet.
useLivenet);
const SNAPSHOT = {};
function broadCastTickers(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        let data;
        // 連接建立成功後首次推送
        if (msg.type === types_1.BybitWsTickerMsgType.snapshot) {
            const ticker = msg.data;
            // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
            data = [
                types_1.Exchange.Bybit,
                ticker.symbol,
                +ticker.last_price,
                +ticker.last_price - +ticker.prev_price_24h,
                +ticker.price_24h_pcnt_e6 / Math.pow(10, 6),
                +ticker.turnover_24h_e8 / Math.pow(10, 8),
            ];
            SNAPSHOT[ticker.symbol] = data;
        }
        // 快照數據推送後，推送的增量數據
        if (msg.type === types_1.BybitWsTickerMsgType.delta) {
            const { update: [ticker], } = msg.data;
            // console.log(ticker);
            // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
            data = [
                types_1.Exchange.Bybit,
                ticker.symbol,
                +ticker.last_price || SNAPSHOT[ticker.symbol][2],
                +ticker.last_price - +ticker.prev_price_24h || SNAPSHOT[ticker.symbol][3],
                +ticker.price_24h_pcnt_e6 / Math.pow(10, 6) || SNAPSHOT[ticker.symbol][4],
                +ticker.turnover_24h_e8 / Math.pow(10, 8) || SNAPSHOT[ticker.symbol][5],
            ];
        }
        const pubMsg = JSON.stringify({
            channel: 'tickers',
            data: [data],
        });
        globalAny.io.to('tickers').emit('tickers', pubMsg);
    });
}
function broadCastKlines(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const channel = util_1.getFormattedKlineSubChannel(msg);
        const pubMsg = JSON.stringify({
            channel,
            data: [
                msg.data[0].start * 1000 + '',
                msg.data[0].open + '',
                msg.data[0].high + '',
                msg.data[0].low + '',
                msg.data[0].close + '',
                msg.data[0].volume,
                msg.data[0].turnover,
            ],
        });
        globalAny.io.to('klines').emit(channel, pubMsg);
    });
}
function setupWsClient() {
    return __awaiter(this, void 0, void 0, function* () {
        // const intervals = ['15m', '1h', '4h'];
        const intervals = ['15', '60'];
        // support combined stream, e.g.
        const instruments = yield dao_1.InstrumentInfoDao.findByTopVolume({
            exchange: types_1.Exchange.Bybit,
            limit: 20,
        });
        const klineStreams = [];
        instruments
            .filter((i) => {
            return i.instrument_id.endsWith('USDT');
        })
            .forEach((e) => {
            intervals.forEach((i) => {
                klineStreams.push(`candle.${i}.${e.instrument_id}`);
            });
        });
        const wsClient = new bybit_api_1.WebsocketClient({
            key: API_KEY,
            secret: PRIVATE_KEY,
            market: 'linear',
            linear: true,
            livenet: true,
        }, logger_1.default);
        wsClient.connectPublic();
        wsClient.on('update', (data) => {
            if (util_1.isKlineMsg(data)) {
                broadCastKlines(data);
            }
            if (util_1.isTickerMsg(data)) {
                broadCastTickers(data);
            }
        });
        wsClient.on('open', (data) => {
            globalAny.bybitWsConnected = true;
            logger_1.default.info('[Bybit] ws open:' + data.wsKey);
            // wsClient.subscribe(klineStreams);
        });
        wsClient.on('response', (data) => {
            logger_1.default.info('[Bybit] ws response: ' + JSON.stringify(data));
        });
        wsClient.on('reconnect', ({ wsKey }) => {
            logger_1.default.info('[Bybit] ws automatically reconnecting.... ' + wsKey);
        });
        wsClient.on('reconnected', (data) => {
            logger_1.default.info('[Bybit] ws has reconnected ' + (data === null || data === void 0 ? void 0 : data.wsKey));
        });
        return wsClient;
    });
}
exports.setupWsClient = setupWsClient;
//# sourceMappingURL=wsClient.js.map