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
exports.getKlines = exports.getInstruments = exports.handleKlines = exports.handleTickers = void 0;
const publicClient_1 = require("../../lib/okex/publicClient");
const config_1 = require("../../config");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const dao_1 = require("../../dao");
const API_KEY = '753285f2-3afb-402e-a468-9783c9ef7e5d';
const PRIVATE_KEY = '4E5CC0FBF38D85827A520D5446F911A7';
const pass_phrase = 'Qazwsx123=-';
const pClient = publicClient_1.default(config_1.OKEX_HTTP_HOST, 10000);
const client = pClient.swap();
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
function getInstruments() {
    return __awaiter(this, void 0, void 0, function* () {
        const tickers = yield client.getTickers();
        const data = yield client.getInstruments();
        if (+data.code === 0) {
            return data.data
                .filter((i) => i.state === 'live')
                .map((i) => {
                const ticker = tickers.data.find((j) => j.instId === i.instId);
                return {
                    instrument_id: i.instId,
                    base_currency: i.ctValCcy,
                    quote_currency: i.settleCcy,
                    tick_size: i.tickSz,
                    contract_val: i.ctVal,
                    listing: i.listTime,
                    delivery: i.expTime,
                    size_increment: +i.lotSz,
                    alias: i.alias,
                    last: ticker.last,
                    chg_24h: ticker.last - ticker.open24h,
                    chg_rate_24h: (((ticker.last - ticker.open24h) * 100) /
                        ticker.open24h).toFixed(4),
                    high_24h: ticker.high24h,
                    low_24h: ticker.low24h,
                    volume_24h: ticker.vol24h * ticker.last * +i.ctVal,
                    timestamp: ticker.ts,
                    open_interest: 0,
                    open_24h: ticker.open24h,
                    volume_token_24h: ticker.volCcy24h,
                    exchange: types_1.Exchange.Okex,
                };
            });
        }
        else {
            return [];
        }
    });
}
exports.getInstruments = getInstruments;
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
        yield dao_1.InstrumentInfoDao.upsert(message.data
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
//# sourceMappingURL=client.js.map