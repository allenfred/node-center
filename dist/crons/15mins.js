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
exports.startJob = void 0;
const util_1 = require("./util");
const connection_1 = require("../database/connection");
const logger_1 = require("../logger");
const Okex = require("../api/okex");
const Binance = require("../api/binance");
const Bybit = require("../api/bybit");
//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// */5 * * * * At every 5 minute.
exports.startJob = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('---- 5mins Job Start Executing ----');
    const startTime = new Date().getTime();
    const dayNow = new Date().getDay();
    const hourNow = new Date().getHours();
    const minuteNow = new Date().getMinutes();
    yield connection_1.default();
    // 15 minutes.
    if (minuteNow % 15 === 0) {
        yield util_1.execJob(util_1.Job_Granularity.FifteenMins);
    }
    // hourly
    if (minuteNow === 0) {
        yield Okex.initInstruments();
        yield Binance.initInstruments();
        yield Bybit.initInstruments();
        yield util_1.execJob(util_1.Job_Granularity.OneHour);
    }
    // 2hourly
    if (hourNow % 2 === 0 && minuteNow === 0) {
        yield util_1.execJob(util_1.Job_Granularity.TwoHour);
    }
    // 4hourly
    if (hourNow % 4 === 0 && minuteNow === 0) {
        yield util_1.execJob(util_1.Job_Granularity.FourHour);
        yield util_1.execJob(util_1.Job_Granularity.OneDay);
    }
    // 6hourly
    if (hourNow % 6 === 0 && minuteNow === 0) {
        yield util_1.execJob(util_1.Job_Granularity.SixHour);
    }
    // 12hourly
    if (hourNow % 12 === 0 && minuteNow === 0) {
        yield Okex.initInstruments();
        yield Binance.initInstruments();
        yield Bybit.initInstruments();
        yield util_1.execJob(util_1.Job_Granularity.TwelveHour);
    }
    // At minute 15 on Monday.
    if (dayNow === 1 && hourNow === 0 && minuteNow === 15) {
        yield util_1.execJob(util_1.Job_Granularity.Weekly);
    }
    const endTime = new Date().getTime();
    const usedTime = ((endTime - startTime) / 1000).toFixed(1);
    logger_1.default.info(`----- Job End Time Used: ${usedTime}s -----`);
    process.exit(0);
});
exports.startJob();
//# sourceMappingURL=15mins.js.map