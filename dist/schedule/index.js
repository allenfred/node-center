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
var schedule = require('node-schedule');
const util_1 = require("./util");
const currencyAPI = require("../okex/currency");
const commonAPI = require("../okex/common");
const logger_1 = require("../logger");
//设置系统限速规则: (okex官方API 限速规则：20次/2s)
function startSchedule() {
    return __awaiter(this, void 0, void 0, function* () {
        yield commonAPI.getBtcUsdSwapMaxCandles();
        yield commonAPI.getBtcUsdtSwapMaxCandles();
        // At every 5 minute.
        schedule.scheduleJob('*/5 * * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----Every 5Mins Job Start Executing----');
            const min = new Date().getMinutes();
            yield util_1.execJob(util_1.Job_Granularity.FiveMins);
            yield util_1.execJob(util_1.Job_Granularity.FifteenMins);
        }));
        // every day - At 00:05.
        schedule.scheduleJob('5 0 * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----EveryDayJob Start Executing----');
            yield util_1.execJob(util_1.Job_Granularity.OneDay);
            yield currencyAPI.getBtcMaxCandles();
            yield commonAPI.getBtcUsdSwapMaxCandles();
            yield commonAPI.getBtcUsdtSwapMaxCandles();
        }));
        // every 4 hours - At minute 5 past every 4th hour.
        schedule.scheduleJob('5 */4 * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----Every4HourJob Start Executing----');
            yield util_1.execJob(util_1.Job_Granularity.FourHour);
        }));
        // every 2 hours - At minute 5 past every 2nd hour.
        schedule.scheduleJob('5 */2 * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----Every2HoursJob Start Executing----');
            yield util_1.execJob(util_1.Job_Granularity.TwoHour);
        }));
        // every hour - At minute 5.
        schedule.scheduleJob('0 * * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----EveryHourJob Start Executing----');
            yield util_1.execJob(util_1.Job_Granularity.OneHour);
        }));
    });
}
exports.startSchedule = startSchedule;
//# sourceMappingURL=index.js.map