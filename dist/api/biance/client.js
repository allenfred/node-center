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
exports.getKlines = exports.setupWsClient = exports.getSwapInsts = exports.getExchangeInfo = exports.client = exports.broadCastMsgByRedis = exports.broadCastByWS = exports.handleMsg = exports.handleKlines = exports.handleTickers = void 0;
const { Spot } = require('@binance/connector');
const types_1 = require("../../types");
const logger_1 = require("../../logger");
const dao_1 = require("../../dao");
const util_1 = require("./util");
let publisher = null;
const client = new Spot('', '', {
    baseURL: 'https://fapi.binance.com',
    wsURL: 'wss://fstream.binance.com',
});
exports.client = client;
function handleTickers(message) {
    return __awaiter(this, void 0, void 0, function* () {
        yield dao_1.InstrumentTickerDao.upsert(message.data
            .filter((i) => i.s.endsWith('USDT') !== -1)
            .map((i) => {
            return {
                instrument_id: i.s,
                last: i.c,
                // chg_24h: i.p, // 24小时价格变化
                chg_24h: +i.c - +i.o,
                // chg_rate_24h: i.P, // 24小时价格变化(百分比)
                chg_rate_24h: (((+i.c - +i.o) * 100) / +i.o).toFixed(4),
                high_24h: i.h,
                low_24h: i.l,
                volume_24h: i.q,
                timestamp: i.E,
                open_interest: '',
                open_24h: i.o,
                volume_token_24h: i.v,
                exchange: types_1.Exchange.Biance,
            };
        }));
    });
}
exports.handleTickers = handleTickers;
function handleKlines(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const k = msg.data['k'];
        yield dao_1.InstrumentKlineDao.upsertOne({
            instrument_id: k.s,
            underlying_index: k.s.replace('USDT', ''),
            quote_currency: 'USDT',
            timestamp: k.t,
            open: +k.o,
            high: +k.h,
            low: +k.l,
            close: +k.c,
            volume: +k.v,
            currency_volume: +k.q,
            granularity: types_1.KlineInterval['candle' + k.i],
            exchange: types_1.Exchange.Biance,
        });
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
        if (new Date().getSeconds() % 10 === 0 && util_1.isKlineMsg(message)) {
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
            // ticker
            if (new Date().getSeconds() % 2 === 0 && util_1.isTickerMsg(msg)) {
                if (client.isApiServer || client.channels.includes('tickers')) {
                    client.send(JSON.stringify({
                        channel: 'tickers',
                        data: msg.data
                            .filter((i) => i.s.endsWith('USDT'))
                            .map((i) => {
                            return [
                                types_1.Exchange.Biance,
                                i.s,
                                i.c,
                                +i.c - +i.o,
                                (((+i.c - +i.o) * 100) / +i.o).toFixed(4),
                                i.q,
                            ];
                        }),
                    }));
                }
            }
            // kline
            /**
             * {
                "e": "kline",     // 事件类型
                "E": 123456789,   // 事件时间
                "s": "BNBUSDT",    // 交易对
                "k": {
                  "t": 123400000, // 这根K线的起始时间
                  "T": 123460000, // 这根K线的结束时间
                  "s": "BNBUSDT",  // 交易对
                  "i": "1m",      // K线间隔
                  "f": 100,       // 这根K线期间第一笔成交ID
                  "L": 200,       // 这根K线期间末一笔成交ID
                  "o": "0.0010",  // 开盘价
                  "c": "0.0020",  // 收盘价
                  "h": "0.0025",  // 最高价
                  "l": "0.0015",  // 最低价
                  "v": "1000",    // 这根K线期间成交量
                  "n": 100,       // 这根K线期间成交笔数
                  "x": false,     // 这根K线是否完结(是否已经开始下一根K线)
                  "q": "1.0000",  // 这根K线期间成交额
                  "V": "500",     // 主动买入的成交量
                  "Q": "0.500",   // 主动买入的成交额
                  "B": "123456"   // 忽略此参数
                }
              }
            */
            if (util_1.isKlineMsg(msg)) {
                const strs = msg.stream.split('_');
                const interval = strs[1]; // 1h
                const instId = msg.data['s'];
                const subChannel = util_1.getKlineSubChannel(interval, instId.toUpperCase());
                if (client.isApiServer || client.channels.includes(subChannel)) {
                    const k = msg.data['k'];
                    client.send(JSON.stringify({
                        channel: subChannel,
                        data: [k.t, k.o, k.h, k.l, k.c, k.v, k.q],
                    }));
                }
            }
        });
    });
}
exports.broadCastByWS = broadCastByWS;
function broadCastMsgByRedis(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.stream === '!ticker@arr' || msg.stream === '!miniTicker@arr') {
            const pubMsg = JSON.stringify({
                channel: 'tickers',
                data: msg.data
                    .filter((i) => i.s.endsWith('USDT'))
                    .map((i) => {
                    // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
                    return [
                        types_1.Exchange.Biance,
                        i.s,
                        i.c,
                        +i.c - +i.o,
                        (((+i.c - +i.o) * 100) / +i.o).toFixed(4),
                        i.q,
                    ];
                    // return {
                    //   instrument_id: i.s, // symbol
                    //   last: i.c, // 最新成交价格
                    //   chg_24h: +i.c - +i.o, // 24小时价格变化
                    //   chg_rate_24h: (((+i.c - +i.o) * 100) / +i.o).toFixed(4), // 24小时价格变化(百分比)
                    //   volume_24h: i.q, // 24小时成交量（按张数统计）
                    //   exchange: Exchange.Biance,
                    // };
                }),
            });
            publisher.publish('tickers', pubMsg);
        }
        // kline msg body
        /**
         * {
            "e": "kline",     // 事件类型
            "E": 123456789,   // 事件时间
            "s": "BNBUSDT",    // 交易对
            "k": {
              "t": 123400000, // 这根K线的起始时间
              "T": 123460000, // 这根K线的结束时间
              "s": "BNBUSDT",  // 交易对
              "i": "1m",      // K线间隔
              "f": 100,       // 这根K线期间第一笔成交ID
              "L": 200,       // 这根K线期间末一笔成交ID
              "o": "0.0010",  // 开盘价
              "c": "0.0020",  // 收盘价
              "h": "0.0025",  // 最高价
              "l": "0.0015",  // 最低价
              "v": "1000",    // 这根K线期间成交量
              "n": 100,       // 这根K线期间成交笔数
              "x": false,     // 这根K线是否完结(是否已经开始下一根K线)
              "q": "1.0000",  // 这根K线期间成交额
              "V": "500",     // 主动买入的成交量
              "Q": "0.500",   // 主动买入的成交额
              "B": "123456"   // 忽略此参数
            }
          }
        */
        if (msg.stream.indexOf('kline') > -1) {
            const strs = msg.stream.split('_');
            const interval = strs[1]; // 1h
            const instId = msg.data['s'];
            const subChannel = util_1.getKlineSubChannel(interval, instId.toUpperCase());
            const k = msg.data['k'];
            let pubMsg = JSON.stringify({
                channel: subChannel,
                data: [k.t, k.o, k.h, k.l, k.c, k.v, k.q],
            });
            publisher.publish('klines', pubMsg);
        }
    });
}
exports.broadCastMsgByRedis = broadCastMsgByRedis;
function setupWsClient(clients) {
    return __awaiter(this, void 0, void 0, function* () {
        // publisher = redisClient.duplicate();
        // await publisher.connect();
        // const intervals = ['15m', '1h', '4h'];
        const intervals = ['15m', '1h'];
        // support combined stream, e.g.
        const instruments = yield dao_1.InstrumentTickerDao.findByTopVolume({
            exchange: types_1.Exchange.Biance,
            limit: 80,
        });
        const klineStreams = [];
        instruments
            .filter((i) => {
            return i.instrument_id.endsWith('USDT');
        })
            .forEach((e) => {
            intervals.forEach((i) => {
                klineStreams.push(e.instrument_id.replace('-', '').toLowerCase() + '@kline_' + i);
            });
        });
        // stream名称中所有交易对均为小写
        // !miniTicker@arr 全市场的精简Ticker
        // !ticker@arr 全市场的完整Ticker
        const combinedStreams = client.combinedStreams(klineStreams.concat(['!miniTicker@arr']), 
        // ['!miniTicker@arr'],
        {
            open: () => {
                logger_1.default.info('!!! 与Biance wsserver建立连接成功 !!!');
            },
            close: () => {
                logger_1.default.error('!!! 与Biance wsserver断开连接 !!!');
            },
            message: (data) => {
                // const jsonData = JSON.parse(data);
                // if (jsonData.stream !== '!ticker@arr') {
                // console.log(data);
                // }
                broadCastByWS(JSON.parse(data), clients);
                handleMsg(JSON.parse(data));
            },
        });
    });
}
exports.setupWsClient = setupWsClient;
/* // API访问的限制
[
  {
    rateLimitType: 'REQUEST_WEIGHT',  // 按照访问权重来计算
    interval: 'MINUTE', // 按照分钟计算
    intervalNum: 1, // 按照1分钟计算
    limit: 2400  // 上限次数
  },
  {
    rateLimitType: 'ORDERS',
    interval: 'MINUTE',
    intervalNum: 1,
    limit: 1200
  },
  {
    rateLimitType: 'ORDERS',
    interval: 'SECOND',
    intervalNum: 10,
    limit: 300
  }
]
*/
function getExchangeInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        return client
            .publicRequest('GET', '/fapi/v1/exchangeInfo', {})
            .then((res) => {
            return res.data;
        })
            .catch((error) => {
            logger_1.default.error(error);
            return [];
        });
    });
}
exports.getExchangeInfo = getExchangeInfo;
function getSwapInsts() {
    return __awaiter(this, void 0, void 0, function* () {
        return client
            .publicRequest('GET', '/fapi/v1/exchangeInfo', {})
            .then((res) => {
            return (res.data.symbols
                // U本位永续合约
                .filter((i) => {
                return (i.contractType === 'PERPETUAL' &&
                    i.marginAsset === 'USDT' &&
                    i.status === 'TRADING');
            })
                .map((i) => {
                let priceFilter;
                let lotSize;
                if (i.filters && i.filters.length) {
                    priceFilter = i.filters.filter((i) => i.filterType === types_1.FilterType.PRICE_FILTER)[0];
                    lotSize = i.filters.filter((i) => i.filterType === types_1.FilterType.LOT_SIZE)[0];
                }
                return {
                    instrument_id: i.symbol,
                    underlying_index: i.baseAsset,
                    quote_currency: i.quoteAsset,
                    tick_size: priceFilter ? priceFilter.tickSize : '0',
                    contract_val: '0',
                    listing: i.onboardDate,
                    delivery: '',
                    trade_increment: '0',
                    size_increment: lotSize.stepSize,
                    alias: 'swap',
                    settlement_currency: i.marginAsset,
                    contract_val_currency: i.quoteAsset,
                    exchange: types_1.Exchange.Biance,
                };
            }));
        })
            .catch((error) => {
            logger_1.default.error(error);
            return [];
        });
    });
}
exports.getSwapInsts = getSwapInsts;
let status = 1;
function getKlines(params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (status !== 1) {
            logger_1.default.error('[Biance] 接口受限 status code:' + status);
        }
        return client
            .publicRequest('GET', '/fapi/v1/klines', params)
            .then((res) => {
            // logger.info(
            //   `获取 [Biance/${params.symbol}/${params.interval}] K线: ${moment(
            //     params.startTime,
            //   ).format('YYYY-MM-DD HH:mm:ss')}至${moment(params.endTime).format(
            //     'MM-DD HH:mm:ss',
            //   )}, ${res.data.length} 条`,
            // );
            return res.data;
        })
            .catch((e) => {
            logger_1.default.error(`获取 [Biance/${params.symbol}/${params.interval}]: ${e.message}`);
            if (e.message.indexOf('418') > -1) {
                status = 418;
            }
            if (e.message.indexOf('429') > -1) {
                status = 429;
            }
            return [];
        });
    });
}
exports.getKlines = getKlines;
//# sourceMappingURL=client.js.map