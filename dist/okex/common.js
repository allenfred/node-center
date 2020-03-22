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
const publicClient_1 = require("./publicClient");
const config_1 = require("../config");
const bluebird = require("bluebird");
const logger_1 = require("../logger");
const types_1 = require("../types");
const dao_1 = require("../dao");
const util_1 = require("../util");
const pClient = publicClient_1.default(config_1.httpHost, 10000);
const candles = [
    "candle60s",
    "candle180s",
    "candle300s",
    "candle900s",
    "candle1800s",
    "candle3600s",
    "candle7200s",
    "candle14400s",
    "candle21600s",
    "candle43200s",
    "candle86400s",
    "candle604800s" // 1 week
];
function getFuturesInstruments() {
    return __awaiter(this, void 0, void 0, function* () {
        return pClient.futures().getInstruments();
    });
}
exports.getFuturesInstruments = getFuturesInstruments;
function getSwapInstruments() {
    return __awaiter(this, void 0, void 0, function* () {
        return pClient.swap().getInstruments();
    });
}
exports.getSwapInstruments = getSwapInstruments;
//获取合约K线数据
function getCandles({ instrumentId, start, end, granularity }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = instrumentId.includes("SWAP")
                ? yield pClient
                    .swap()
                    .getCandles(instrumentId, { start, end, granularity })
                : yield pClient
                    .futures()
                    .getCandles(instrumentId, { start, end, granularity });
            logger_1.default.info(`获取 ${instrumentId}/${granularity} K线成功: 从${start}至${end}, 共 ${data.length} 条`);
            return data;
        }
        catch (e) {
            logger_1.default.error(`获取 ${instrumentId}/${granularity} K线失败: 从${start}至${end}`);
            return [];
        }
    });
}
exports.getCandles = getCandles;
function getSwapSubCommands(instruments) {
    return getBasicCommands(instruments, types_1.Business.SWAP);
}
exports.getSwapSubCommands = getSwapSubCommands;
function getFuturesSubCommands(instruments) {
    return getBasicCommands(instruments, types_1.Business.FUTURES);
}
exports.getFuturesSubCommands = getFuturesSubCommands;
//指令格式:<business>/<channel>:<filter>
function getBasicCommands(instruments, business) {
    //公共Ticker频道
    const tickerChannels = instruments.map((i) => {
        return `${business}/ticker:${i.instrument_id}`;
    });
    //公共-K线频道
    const candleChannels = [];
    instruments.map((i) => {
        candles.map(candle => {
            candleChannels.push(`${business}/${candle}:${i.instrument_id}`);
        });
    });
    //公共-交易频道
    const tradeChannels = instruments.map((i) => {
        return `${business}/trade:${i.instrument_id}`;
    });
    //公共-限价频道
    const priceRangeChannels = instruments.map((i) => {
        return `${business}/price_range:${i.instrument_id}`;
    });
    //公共-200档深度频道
    const depthChannels = instruments.map((i) => {
        return `${business}/depth:${i.instrument_id}`;
    });
    //公共-标记价格频道
    const markPriceChannels = instruments.map((i) => {
        return `${business}/mark_price:${i.instrument_id}`;
    });
    return (tickerChannels
        .concat(candleChannels)
        .concat(tradeChannels)
        .concat(priceRangeChannels)
        // .concat(depthChannels)
        .concat(markPriceChannels));
}
exports.getBasicCommands = getBasicCommands;
function getCandlesByGroup(options) {
    return __awaiter(this, void 0, void 0, function* () {
        bluebird.map(options, (option) => __awaiter(this, void 0, void 0, function* () {
            const data = yield getCandles({
                instrumentId: option.instrument_id,
                start: option.start,
                end: option.end,
                granularity: option.granularity
            });
            const readyCandles = data.map((candle) => {
                return {
                    instrument_id: option.instrument_id,
                    underlying_index: option.underlying_index,
                    quote_currency: option.quote_currency,
                    timestamp: new Date(candle[0]),
                    open: +candle[1],
                    high: +candle[2],
                    low: +candle[3],
                    close: +candle[4],
                    volume: +candle[5],
                    currency_volume: +candle[6],
                    alias: option.alias,
                    granularity: option.granularity
                };
            });
            return yield dao_1.InstrumentCandleDao.upsert(readyCandles);
        }), { concurrency: 5 });
    });
}
exports.getCandlesByGroup = getCandlesByGroup;
function getCandlesWithLimitedSpeed(options) {
    return __awaiter(this, void 0, void 0, function* () {
        //设置系统限速规则: 10次/2s (okex官方API 限速规则：20次/2s)
        const groupCount = Math.round(options.length / 10);
        let start = 0;
        yield bluebird.map(new Array(groupCount).fill(null), () => __awaiter(this, void 0, void 0, function* () {
            yield getCandlesByGroup(options.slice(start, start + 10));
            start += 10;
            return util_1.sleep(2);
        }), { concurrency: 1 });
    });
}
exports.getCandlesWithLimitedSpeed = getCandlesWithLimitedSpeed;
//# sourceMappingURL=common.js.map