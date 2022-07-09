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
exports.getKlinesReqParams = exports.getBybitKlines = exports.getOkexKlines = exports.getBianceKlines = exports.getKlines = exports.getKlinesWithLimited = void 0;
const bluebird = require("bluebird");
const types_1 = require("../types");
const dao_1 = require("../dao");
const util_1 = require("../util");
const Biance = require("./biance/client");
const Okex = require("./okex/client");
const Bybit = require("./bybit/client");
const logger_1 = require("../logger");
const BianceKlineInterval = {
    300: '5m',
    900: '15m',
    1800: '30m',
    3600: '1h',
    7200: '2h',
    14400: '4h',
    21600: '6h',
    43200: '12h',
    86400: '1d',
    604800: '1w',
};
const BybitKlineInterval = {
    300: '5',
    900: '15',
    1800: '30',
    3600: '60',
    7200: '120',
    14400: '240',
    21600: '360',
    43200: '720',
    86400: 'D',
    604800: 'W',
};
function getKlinesWithLimited(options, updateOperate = dao_1.InstrumentKlineDao.upsertMany) {
    return __awaiter(this, void 0, void 0, function* () {
        //设置系统限速规则 (biance官方API 限速规则：2400次/60s)
        //设置系统限速规则 (Okex官方API 限速规则：20次/2s)
        return bluebird.map(options, (option) => __awaiter(this, void 0, void 0, function* () {
            const { exchange, instrument_id, granularity } = option;
            Promise.resolve()
                .then(() => {
                if (exchange === types_1.Exchange.Biance) {
                    return Biance.getKlines({
                        symbol: option.instrument_id,
                        interval: BianceKlineInterval[option.granularity],
                        startTime: new Date(option.start).valueOf(),
                        endTime: new Date(option.end).valueOf(),
                        limit: 1500,
                    });
                }
                else if (exchange === types_1.Exchange.Okex) {
                    return Okex.getKlines({
                        instrumentId: option.instrument_id,
                        granularity: option.granularity,
                        start: new Date(option.start).valueOf(),
                        end: new Date(option.end).valueOf(),
                    });
                }
            })
                .then((data) => {
                let klines = [];
                if (exchange === types_1.Exchange.Okex) {
                    klines = data.map((candle) => {
                        return {
                            instrument_id: option.instrument_id,
                            underlying_index: option.instrument_id.endsWith('USDT')
                                ? option.instrument_id.replace('USDT', '')
                                : option.instrument_id.split('-')[0],
                            timestamp: new Date(+candle[0]),
                            open: +candle[1],
                            high: +candle[2],
                            low: +candle[3],
                            close: +candle[4],
                            volume: +candle[5],
                            currency_volume: +candle[6],
                            granularity: option.granularity,
                            exchange: types_1.Exchange.Okex,
                        };
                    });
                }
                else if (exchange === types_1.Exchange.Biance) {
                    klines = data.map((kline) => {
                        return {
                            instrument_id: option.instrument_id,
                            underlying_index: option.instrument_id.replace('USDT', ''),
                            timestamp: new Date(+kline[0]),
                            open: +kline[1],
                            high: +kline[2],
                            low: +kline[3],
                            close: +kline[4],
                            volume: +kline[5],
                            currency_volume: +kline[7],
                            granularity: option.granularity,
                            exchange: types_1.Exchange.Biance,
                        };
                    });
                }
                return updateOperate({
                    exchange,
                    instrument_id: instrument_id,
                    granularity: granularity,
                }, klines);
            })
                .then(() => {
                logger_1.default.info(`[${exchange}/${exchange}/${types_1.KlineInterval[+granularity]}] K线 Done.`);
                return Promise.resolve();
            })
                .catch((err) => {
                logger_1.default.error(err);
            });
        }), { concurrency: 5 });
    });
}
exports.getKlinesWithLimited = getKlinesWithLimited;
function getBianceKlines(options, updateOperate = dao_1.InstrumentKlineDao.upsertMany) {
    return __awaiter(this, void 0, void 0, function* () {
        //设置系统限速规则 (biance官方API 限速规则：2400次/60s)
        return bluebird.map(options, (option) => __awaiter(this, void 0, void 0, function* () {
            const { exchange, instrument_id, granularity } = option;
            return Biance.getKlines({
                symbol: instrument_id,
                interval: BianceKlineInterval[granularity],
                startTime: new Date(option.start).valueOf(),
                endTime: new Date(option.end).valueOf(),
                limit: 1500,
            })
                .then((data) => {
                let klines = [];
                klines = data.map((candle) => {
                    return {
                        instrument_id,
                        underlying_index: instrument_id.replace('USDT', ''),
                        quote_currency: 'USDT',
                        timestamp: new Date(+candle[0]),
                        open: +candle[1],
                        high: +candle[2],
                        low: +candle[3],
                        close: +candle[4],
                        volume: +candle[5],
                        currency_volume: +candle[6],
                        granularity,
                        exchange,
                    };
                });
                return updateOperate({
                    exchange,
                    instrument_id,
                    granularity,
                }, klines);
            })
                .then(() => {
                logger_1.default.info(`[Biance/${instrument_id}/${types_1.KlineInterval[+granularity]}] K线 Done.`);
                return Promise.resolve();
            });
        }), { concurrency: 2 });
    });
}
exports.getBianceKlines = getBianceKlines;
function getBybitKlines(options, updateOperate = dao_1.InstrumentKlineDao.upsertMany) {
    return __awaiter(this, void 0, void 0, function* () {
        //设置系统限速规则 (bybit官方API 限速规则：20次/s)
        return bluebird.map(options, (option) => __awaiter(this, void 0, void 0, function* () {
            const { exchange, instrument_id, granularity } = option;
            return Bybit.getKlines({
                symbol: instrument_id,
                interval: BybitKlineInterval[granularity],
                from: Math.round(new Date(option.start).valueOf() / 1000),
                limit: 200,
            })
                .then((data) => {
                let klines = [];
                klines = data.map((kline) => {
                    return {
                        instrument_id,
                        underlying_index: instrument_id.replace('USDT', ''),
                        timestamp: new Date(+kline.start_at * 1000),
                        open: kline.open,
                        high: kline.high,
                        low: kline.low,
                        close: kline.close,
                        volume: kline.volume,
                        currency_volume: kline.turnover,
                        granularity,
                        exchange,
                    };
                });
                return updateOperate({
                    exchange,
                    instrument_id,
                    granularity,
                }, klines);
            })
                .then(() => {
                logger_1.default.info(`[Bybit/${instrument_id}/${types_1.KlineInterval[+granularity]}] K线 Done.`);
                return Promise.resolve();
            });
        }), { concurrency: 5 });
    });
}
exports.getBybitKlines = getBybitKlines;
function getOkexKlines(options, updateOperate = dao_1.InstrumentKlineDao.upsertMany) {
    return __awaiter(this, void 0, void 0, function* () {
        //设置系统限速规则 (Okex官方API 限速规则：20次/2s)
        return bluebird.map(options, (option) => __awaiter(this, void 0, void 0, function* () {
            const { exchange, instrument_id, granularity } = option;
            return Okex.getKlines({
                instrumentId: instrument_id,
                granularity,
                start: new Date(option.start).valueOf(),
                end: new Date(option.end).valueOf(),
            })
                .then((data) => {
                let klines = [];
                klines = data.map((candle) => {
                    return {
                        instrument_id,
                        underlying_index: instrument_id.split('-')[0],
                        quote_currency: 'USDT',
                        timestamp: new Date(+candle[0]),
                        open: +candle[1],
                        high: +candle[2],
                        low: +candle[3],
                        close: +candle[4],
                        volume: +candle[5],
                        currency_volume: +candle[6],
                        granularity,
                        exchange,
                    };
                });
                return updateOperate({
                    exchange,
                    instrument_id,
                    granularity,
                }, klines);
            })
                .then(() => {
                logger_1.default.info(`[Okex/${instrument_id}/${types_1.KlineInterval[+granularity]}] K线 Done.`);
                return Promise.resolve();
            });
        }), { concurrency: 5 });
    });
}
exports.getOkexKlines = getOkexKlines;
function getKlinesReqParams(opts) {
    const reqOptions = [];
    let count = 200;
    if (opts && opts.count > 0) {
        count = opts.count;
    }
    const { instId, exchange } = opts;
    reqOptions.push(Object.assign({}, {
        instrument_id: instId,
        start: opts.start || util_1.getTimestamp(15 * -count, 'm'),
        end: opts.end || util_1.getTimestamp(0, 'm'),
        granularity: 900,
    }));
    reqOptions.push(Object.assign({}, {
        instrument_id: instId,
        start: opts.start || util_1.getTimestamp(1 * -count, 'h'),
        end: opts.end || util_1.getTimestamp(0, 'h'),
        granularity: 3600,
    }));
    reqOptions.push(Object.assign({}, {
        instrument_id: instId,
        start: opts.start || util_1.getTimestamp(4 * -count, 'h'),
        end: opts.end || util_1.getTimestamp(0, 'h'),
        granularity: 14400,
    }));
    reqOptions.push(Object.assign({}, {
        instrument_id: instId,
        start: opts.start || util_1.getTimestamp(24 * -count, 'h'),
        end: opts.end || util_1.getTimestamp(0, 'h'),
        granularity: 86400,
    }));
    if (instId.indexOf('BTC') !== -1) {
        reqOptions.push(Object.assign({}, {
            instrument_id: instId,
            start: opts.start || util_1.getTimestamp(30 * -count, 'm'),
            end: opts.end || util_1.getTimestamp(0, 'm'),
            granularity: 1800,
        }));
        reqOptions.push(Object.assign({}, {
            instrument_id: instId,
            start: opts.start || util_1.getTimestamp(2 * -count, 'h'),
            end: opts.end || util_1.getTimestamp(0, 'h'),
            granularity: 7200,
        }));
        reqOptions.push(Object.assign({}, {
            instrument_id: instId,
            start: opts.start || util_1.getTimestamp(6 * -count, 'h'),
            end: opts.end || util_1.getTimestamp(0, 'h'),
            granularity: 21600,
        }));
        reqOptions.push(Object.assign({}, {
            instrument_id: instId,
            start: opts.start || util_1.getTimestamp(12 * -count, 'h'),
            end: opts.end || util_1.getTimestamp(0, 'h'),
            granularity: 43200,
        }));
    }
    return reqOptions.map((opt) => {
        return Object.assign(opt, { exchange });
    });
}
exports.getKlinesReqParams = getKlinesReqParams;
// 获取最近100条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
// For BTC (15min 30min 1h 2h 4h 6h 12h 1d)
// For Others (15min 1h 4h 1d)
function getKlines(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getKlinesWithLimited(getKlinesReqParams(opts).map((opt) => {
            return Object.assign({}, opt, { exchange: opts.exchange });
        }));
    });
}
exports.getKlines = getKlines;
//# sourceMappingURL=common.js.map