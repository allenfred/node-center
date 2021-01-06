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
        // At every 5 minute.
        schedule.scheduleJob('*/5 * * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----Every5MinsJob Start Executing----');
            yield util_1.execJob(60 * 5);
        }));
        // At every 15 minute.
        schedule.scheduleJob('*/15 * * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----Every15MinsJob Start Executing----');
            yield util_1.execJob(60 * 15);
        }));
        // every week.
        schedule.scheduleJob('0 0 * * 0', () => {
            logger_1.default.info('----执行 周线 K线定时任务----');
            util_1.execJob(60 * 1440 * 7);
        });
        // every day - At 00:05.
        schedule.scheduleJob('5 0 * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----EveryDayJob Start Executing----');
            yield util_1.execJob(60 * 1440);
            // 获取最多过去1440条k线数据
            yield currencyAPI.getBtcMaxCandles();
            yield commonAPI.getBtcSwapMaxCandles();
        }));
        // every 12 hours - At 12:05.
        schedule.scheduleJob('5 12 * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----Every12HoursJob Start Executing----');
            yield util_1.execJob(60 * 720);
        }));
        // every 4 hours - At minute 5 past every 4th hour.
        schedule.scheduleJob('5 */4 * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----Every4HourJob Start Executing----');
            yield util_1.execJob(60 * 240);
        }));
        // every 2 hours - At minute 5 past every 2nd hour.
        schedule.scheduleJob('5 */2 * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----Every2HoursJob Start Executing----');
            yield util_1.execJob(60 * 120);
        }));
        // every hour - At minute 5.
        schedule.scheduleJob('0 * * * *', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('----EveryHourJob Start Executing----');
            yield util_1.execJob(60 * 60);
            // 获取最近200条k线数据
            yield currencyAPI.getBtcLatestCandles();
            yield commonAPI.getBtcSwapLatestCandles();
        }));
    });
}
exports.startSchedule = startSchedule;
//# sourceMappingURL=index.js.map