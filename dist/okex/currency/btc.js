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
const publicClient_1 = require("./../publicClient");
const config_1 = require("../../config");
const bluebird = require("bluebird");
const logger_1 = require("../../logger");
const dao_1 = require("../../dao");
const util_1 = require("../../util");
const pClient = publicClient_1.default(config_1.httpHost, 10000);
//获取合约K线数据
function getCandles({ instrumentId, start, end, granularity }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield pClient
                .spot()
                .getSpotCandles(instrumentId, { start, end, granularity });
            logger_1.default.info(`获取 ${instrumentId}/${granularity} K线成功: 从${start}至${end}, 共 ${data.length} 条`);
            return data;
        }
        catch (e) {
            logger_1.default.error(`获取 ${instrumentId}/${granularity} K线失败: 从${start}至${end}`);
            return [];
        }
    });
}
function getCandlesByGroup(options) {
    return __awaiter(this, void 0, void 0, function* () {
        bluebird.map(options, (option) => __awaiter(this, void 0, void 0, function* () {
            const data = yield getCandles({
                instrumentId: "BTC-USDT",
                start: option.start,
                end: option.end,
                granularity: option.granularity
            });
            const readyCandles = data.map((candle) => {
                return {
                    instrument_id: "BTC-USDT",
                    timestamp: new Date(candle[0]),
                    open: +candle[1],
                    high: +candle[2],
                    low: +candle[3],
                    close: +candle[4],
                    volume: +candle[5],
                    granularity: option.granularity
                };
            });
            return yield dao_1.BtcUSDTCandleDao.upsert(readyCandles);
        }), { concurrency: 5 });
    });
}
// 获取最多过去1440条k线数据
function getBtcMaxCandles() {
    return __awaiter(this, void 0, void 0, function* () {
        const reqOptions = [];
        for (let i = 0; i < 10; i++) {
            reqOptions.push({
                start: util_1.getISOString((i + 1) * 4 * -200, "h"),
                end: util_1.getISOString(i * 4 * -200, "h"),
                granularity: 14400 // 4h
            });
            reqOptions.push({
                start: util_1.getISOString((i + 1) * 6 * -200, "h"),
                end: util_1.getISOString(i * 6 * -200, "h"),
                granularity: 21600 // 6h
            });
            reqOptions.push({
                start: util_1.getISOString((i + 1) * 12 * -200, "h"),
                end: util_1.getISOString(i * 12 * -200, "h"),
                granularity: 43200 // 12h
            });
            reqOptions.push({
                start: util_1.getISOString((i + 1) * 24 * -200, "h"),
                end: util_1.getISOString(i * 24 * -200, "h"),
                granularity: 86400 // 1d
            });
        }
        return yield getCandlesByGroup(reqOptions);
    });
}
exports.getBtcMaxCandles = getBtcMaxCandles;
// 获取最近200条k线数据
function getBtcLatestCandles() {
    return __awaiter(this, void 0, void 0, function* () {
        const reqOptions = [];
        reqOptions.push({
            start: util_1.getISOString(4 * -200, "h"),
            end: util_1.getISOString(0, "h"),
            granularity: 14400 // 4h
        });
        reqOptions.push({
            start: util_1.getISOString(6 * -200, "h"),
            end: util_1.getISOString(0, "h"),
            granularity: 21600 // 6h
        });
        reqOptions.push({
            start: util_1.getISOString(12 * -200, "h"),
            end: util_1.getISOString(0, "h"),
            granularity: 43200 // 12h
        });
        reqOptions.push({
            start: util_1.getISOString(24 * -200, "h"),
            end: util_1.getISOString(0, "h"),
            granularity: 86400 // 1d
        });
        return yield getCandlesByGroup(reqOptions);
    });
}
exports.getBtcLatestCandles = getBtcLatestCandles;
//# sourceMappingURL=btc.js.map