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
exports.getKlines = exports.getInstruments = exports.getTickers = void 0;
const { LinearClient } = require('bybit-api');
const types_1 = require("../../types");
const logger_1 = require("../../logger");
const API_KEY = 'iS12CdTOC1SmCs5kQ0';
const PRIVATE_KEY = 'Vz2L9UokimS6bz5ePwTHzWhcUXkd1qlul3MI';
const useLivenet = true;
const client = new LinearClient(API_KEY, PRIVATE_KEY, 
// optional, uses testnet by default. Set to 'true' to use livenet.
useLivenet);
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
function getInstruments() {
    return __awaiter(this, void 0, void 0, function* () {
        const tickers = yield client.getTickers();
        const symbols = yield client.getSymbols();
        // U本位永续合约
        return symbols.result
            .filter((i) => {
            return i.quote_currency === 'USDT' && i.status === 'Trading';
        })
            .map((i) => {
            let priceFilter;
            let lotSize;
            if (i.price_filter) {
                priceFilter = i.price_filter;
                lotSize = i.lot_size_filter;
            }
            const ticker = tickers.result.find((j) => j.symbol === i.name);
            return {
                instrument_id: i.name,
                base_currency: i.base_currency,
                quote_currency: i.quote_currency,
                tick_size: priceFilter.tick_size,
                contract_val: lotSize.qty_step,
                listing: '',
                delivery: '',
                size_increment: lotSize.stepSize,
                alias: 'swap',
                last: +ticker.last_price,
                chg_24h: +ticker.last_price - +ticker.prev_price_24h,
                chg_rate_24h: +ticker.price_24h_pcnt * 100,
                high_24h: +ticker.high_price_24h,
                low_24h: +ticker.low_price_24h,
                volume_24h: +ticker.turnover_24h,
                timestamp: null,
                open_interest: ticker.open_interest,
                open_24h: +ticker.prev_price_24h,
                volume_token_24h: ticker.volume_24h,
                exchange: types_1.Exchange.Bybit,
            };
        });
    });
}
exports.getInstruments = getInstruments;
function getKlines(param) {
    return __awaiter(this, void 0, void 0, function* () {
        return client
            .getKline(param)
            .then((res) => {
            return res.result;
        })
            .catch((e) => {
            logger_1.default.error(`获取 [Bybit/${param.symbol}/${param.interval}]: ${e.message}`);
            if (e.message.indexOf('403') > -1) {
                logger_1.default.error('接口受限');
            }
            return [];
        });
    });
}
exports.getKlines = getKlines;
function getTickers() {
    return __awaiter(this, void 0, void 0, function* () {
        const tickers = yield client.getTickers();
        // U本位永续合约
        return tickers.result
            .filter((i) => {
            return i.symbol === 'USDT';
        })
            .map((ticker) => {
            return {
                instrument_id: ticker.symbol,
                last: +ticker.last_price,
                chg_24h: +ticker.last_price - +ticker.prev_price_24h,
                chg_rate_24h: +ticker.price_24h_pcnt,
                high_24h: +ticker.high_price_24h,
                low_24h: +ticker.low_price_24h,
                volume_24h: +ticker.turnover_24h,
                timestamp: null,
                open_interest: ticker.open_interest,
                open_24h: +ticker.prev_price_24h,
                volume_token_24h: ticker.volume_24h,
                exchange: types_1.Exchange.Bybit,
            };
        });
    });
}
exports.getTickers = getTickers;
//# sourceMappingURL=client.js.map