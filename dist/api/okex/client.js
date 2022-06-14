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
exports.getKlines = exports.getSwapInsts = exports.setupWsClient = exports.broadCastByRedis = exports.broadCastByWS = exports.handleMsg = exports.handleKlines = exports.handleTickers = void 0;
const publicClient_1 = require("../../lib/okex/publicClient");
const okex_node_1 = require("@okfe/okex-node");
const config_1 = require("../../config");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const dao_1 = require("../../dao");
const util_1 = require("./util");
const pClient = publicClient_1.default(config_1.OKEX_HTTP_HOST, 10000);
let publisher = null;
const OkxIntervalBar = {
    300: '5m',
    900: '15m',
    1800: '30m',
    3600: '1H',
    7200: '2H',
    14400: '4H',
    21600: '6H',
    43200: '12H',
    86400: '1D',
    604800: '1W',
};
function getSwapInsts() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield pClient
            .swap()
            .getInstruments();
        if (+data.code === 0) {
            return data.data
                .filter((i) => i.state === 'live')
                .map((i) => {
                return {
                    instrument_id: i.instId,
                    underlying_index: i.ctValCcy,
                    quote_currency: i.settleCcy,
                    tick_size: i.tickSz,
                    contract_val: i.ctVal,
                    listing: i.listTime,
                    delivery: i.expTime,
                    trade_increment: i.lotSz,
                    size_increment: i.lotSz,
                    alias: i.alias,
                    settlement_currency: i.settleCcy,
                    contract_val_currency: i.ctValCcy,
                    exchange: types_1.Exchange.Okex,
                };
            });
        }
        else {
            return [];
        }
    });
}
exports.getSwapInsts = getSwapInsts;
// V5 获取合约K线数据
function getKlines({ instrumentId, start, end, granularity, }) {
    return __awaiter(this, void 0, void 0, function* () {
        return pClient
            .getCandles({
            instId: instrumentId,
            before: new Date(start).valueOf(),
            after: new Date(end).valueOf(),
            bar: OkxIntervalBar[+granularity],
            limit: 300,
        })
            .then((res) => {
            // logger.info(
            //   `获取 [Okx/${instrumentId}/${
            //     KlineInterval[+granularity]
            //   }] K线: ${moment(start).format('YYYY-MM-DD HH:mm:ss')}至${moment(
            //     end,
            //   ).format('MM-DD HH:mm:ss')}, ${res.data.length} 条`,
            // );
            return res.data;
        })
            .catch((e) => {
            logger_1.default.error(`获取 [Okx/${instrumentId}/${types_1.KlineInterval[+granularity]}]: ${e}`);
            return [];
        });
    });
}
exports.getKlines = getKlines;
function getSwapSubArgs(instruments) {
    return getBasicArgs(instruments);
}
function getBasicArgs(instruments) {
    const klineArgs = [];
    instruments.map((i) => {
        // 公共-K线频道
        // const subChannels = ['candle15m', 'candle1H', 'candle4H'];
        const subChannels = ['candle15m', 'candle1H'];
        subChannels.map((candleChannel) => {
            klineArgs.push({ channel: candleChannel, instId: i.instrument_id });
        });
    });
    // 公共-行情频道
    const tickerArgs = instruments.map((i) => {
        return { channel: 'tickers', instId: i.instrument_id };
    });
    // 公共-持仓总量频道
    const openInterstArgs = instruments.map((i) => {
        return { channel: 'open-interest', instId: i.instrument_id };
    });
    // 公共-交易频道
    const tradeArgs = instruments.map((i) => {
        return { channel: 'trades', instId: i.instrument_id };
    });
    // 公共-资金费率频道
    const fundingRateArgs = instruments.map((i) => {
        return { channel: 'funding-rate', instId: i.instrument_id };
    });
    return klineArgs.concat(tickerArgs);
}
/* V5 API
{
  "arg": {
    "channel": "candle1D",
    "instId": "BTC-USDT-SWAP"
  },
  "data": [
    [
      "1629993600000",
      "42500",
      "48199.9",
      "41006.1",
      "41006.1",
      "3587.41204591",
      "166741046.22583129"
    ]
  ]
}
*/
function handleTickers(message) {
    return __awaiter(this, void 0, void 0, function* () {
        yield dao_1.InstrumentTickerDao.upsert(message.data
            .filter((i) => i.instId.indexOf('USDT') !== -1)
            .map((i) => {
            return {
                instrument_id: i.instId,
                last: i.last,
                chg_24h: i.last - i.open24h,
                chg_rate_24h: (((i.last - i.open24h) * 100) / i.open24h).toFixed(4),
                high_24h: i.high24h,
                low_24h: i.low24h,
                volume_24h: i.vol24h,
                timestamp: i.ts,
                open_interest: '0',
                open_24h: i.open24h,
                volume_token_24h: i.volCcy24h,
                exchange: types_1.Exchange.Okex,
            };
        }));
    });
}
exports.handleTickers = handleTickers;
function handleKlines(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const granularity = types_1.KlineInterval[message.arg.channel.toLowerCase()];
        const instrumentId = message.arg.instId;
        const klines = message.data.map((kline) => {
            return {
                instrument_id: instrumentId,
                underlying_index: instrumentId.split('-')[0],
                quote_currency: instrumentId.split('-')[1],
                timestamp: new Date(+kline[0]),
                open: +kline[1],
                high: +kline[2],
                low: +kline[3],
                close: +kline[4],
                volume: +kline[5],
                currency_volume: +kline[6],
                granularity: +granularity,
                exchange: types_1.Exchange.Okex,
            };
        });
        yield dao_1.InstrumentKlineDao.upsertOne(klines[0]);
    });
}
exports.handleKlines = handleKlines;
function handleMsg(message) {
    return __awaiter(this, void 0, void 0, function* () {
        // 每15min更新一次Ticker
        if (util_1.isTickerMsg(message) &&
            new Date().getMinutes() % 15 === 0 &&
            new Date().getSeconds() < 30) {
            handleTickers(message);
        }
        //  每30秒 更新K线数据
        if (new Date().getSeconds() % 30 === 0 && util_1.isKlineMsg(message)) {
            handleKlines(message);
        }
    });
}
exports.handleMsg = handleMsg;
function broadCastByWS(msg, clients) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!clients.length) {
            return;
        }
        clients.map((client) => {
            let pubMsg = null;
            if (new Date().getSeconds() % 2 === 0 && msg.arg.channel === 'tickers') {
                if (client.isApiServer || client.channels.includes('tickers')) {
                    pubMsg = JSON.stringify({
                        channel: 'tickers',
                        data: msg.data.map((i) => {
                            // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
                            return [
                                types_1.Exchange.Okex,
                                i.instId,
                                i.last,
                                i.last - i.open24h,
                                (((i.last - i.open24h) * 100) / i.open24h).toFixed(4),
                                i.vol24h,
                            ];
                        }),
                    });
                }
            }
            if (util_1.isKlineMsg(msg)) {
                if (client.isApiServer ||
                    client.channels.includes(util_1.getKlineSubChannel(msg.arg))) {
                    pubMsg = JSON.stringify({
                        channel: util_1.getKlineSubChannel(msg.arg),
                        data: msg.data[0],
                    });
                }
            }
            if (pubMsg) {
                client.send(pubMsg);
            }
        });
    });
}
exports.broadCastByWS = broadCastByWS;
function broadCastByRedis(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.arg.channel === 'tickers') {
            const pubMsg = JSON.stringify({
                channel: 'tickers',
                data: msg.data.map((i) => {
                    // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
                    return [
                        types_1.Exchange.Okex,
                        i.instId,
                        i.last,
                        i.last - i.open24h,
                        (((i.last - i.open24h) * 100) / i.open24h).toFixed(4),
                        i.vol24h,
                    ];
                }),
            });
            publisher.publish('tickers', pubMsg);
        }
        if (msg.arg.channel.includes('candle')) {
            const pubMsg = JSON.stringify({
                channel: util_1.getKlineSubChannel(msg.arg),
                data: msg.data[0],
            });
            publisher.publish('klines', pubMsg);
        }
    });
}
exports.broadCastByRedis = broadCastByRedis;
function setupWsClient(clients) {
    return __awaiter(this, void 0, void 0, function* () {
        const wsClient = new okex_node_1.V3WebsocketClient(config_1.OKEX_WS_HOST);
        wsClient.connect();
        wsClient.on('open', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('!!! 与Okx wsserver建立连接成功 !!!');
            // wsClient.login(apikey, secret, passphrase);
            const instruments = yield dao_1.InstrumentInfoDao.find({
                exchange: types_1.Exchange.Okex,
            });
            // 订阅永续频道信息
            wsClient.subscribe(...getSwapSubArgs(instruments));
        }));
        wsClient.on('close', () => {
            logger_1.default.error('!!! 与Okx wsserver断开连接 !!!');
            wsClient.connect();
        });
        wsClient.on('message', (data) => {
            try {
                // logger.info(`!!! ws message =${data}`);
                const obj = JSON.parse(data);
                const eventType = obj.event;
                // if (eventType == 'login') {
                //   //登录消息
                //   if (obj?.success == true) {
                //     event.emit('login');
                //   }
                //   return;
                // }
                // 公共频道消息
                if (eventType == undefined) {
                    // broadCastMsg(obj);
                    broadCastByWS(obj, clients);
                    handleMsg(obj);
                }
            }
            catch (e) {
                logger_1.default.error('handleMessage catch err: ', e);
            }
        });
    });
}
exports.setupWsClient = setupWsClient;
//# sourceMappingURL=client.js.map