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
exports.getKlines = exports.getInstruments = exports.getExchangeInfo = void 0;
const { Spot } = require('@binance/connector');
const types_1 = require("../../types");
const logger_1 = require("../../logger");
const client = new Spot('', '', {
    baseURL: 'https://fapi.binance.com',
    wsURL: 'wss://fstream.binance.com',
});
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
function getInstruments() {
    return __awaiter(this, void 0, void 0, function* () {
        const tickersData = yield client.publicRequest('GET', '/fapi/v1/ticker/24hr');
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
                const ticker = tickersData.data.find((j) => j.symbol === i.symbol);
                if (i.filters && i.filters.length) {
                    priceFilter = i.filters.filter((i) => i.filterType === types_1.FilterType.PRICE_FILTER)[0];
                    lotSize = i.filters.filter((i) => i.filterType === types_1.FilterType.LOT_SIZE)[0];
                }
                return {
                    instrument_id: i.symbol,
                    base_currency: i.baseAsset,
                    quote_currency: i.quoteAsset,
                    tick_size: priceFilter ? priceFilter.tickSize : '0',
                    contract_val: '0',
                    listing: i.onboardDate,
                    delivery: '',
                    size_increment: lotSize.stepSize,
                    alias: 'swap',
                    last: +ticker.lastPrice,
                    chg_24h: +ticker.priceChange,
                    chg_rate_24h: +ticker.priceChangePercent,
                    high_24h: ticker.highPrice,
                    low_24h: ticker.lowPrice,
                    volume_24h: ticker.quoteVolume,
                    timestamp: ticker.closeTime,
                    open_interest: '',
                    open_24h: ticker.openPrice,
                    volume_token_24h: ticker.volume,
                    exchange: types_1.Exchange.Binance,
                };
            }));
        })
            .catch((error) => {
            logger_1.default.error(error);
            return [];
        });
    });
}
exports.getInstruments = getInstruments;
let status = 1;
function getKlines(params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (status !== 1) {
            logger_1.default.error('[Binance] 接口受限 status code:' + status);
        }
        return client
            .publicRequest('GET', '/fapi/v1/klines', params)
            .then((res) => {
            return res.data;
        })
            .catch((e) => {
            logger_1.default.error(`获取 [Binance/${params.symbol}/${params.interval}]: ${e.message}`);
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