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
var schedule = require("node-schedule");
const util_1 = require("./util");
const currency_1 = require("../okex/currency");
const logger_1 = require("../logger");
//设置系统限速规则: (okex官方API 限速规则：20次/2s)
function startSchedule() {
    return __awaiter(this, void 0, void 0, function* () {
        schedule.scheduleJob("*/15 * * * *", () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info("----Every15MinsJob Start Executing----");
            yield util_1.execJob(60 * 15);
        }));
        // every week.
        schedule.scheduleJob("0 0 * * 0", () => {
            logger_1.default.info("----执行 周线 K线定时任务----");
            util_1.execJob(60 * 1440 * 7);
        });
        // every day
        schedule.scheduleJob("0 0 * * *", () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info("----EveryDayJob Start Executing----");
            yield util_1.execJob(60 * 1440);
        }));
        // every 12 hours
        schedule.scheduleJob("0 */12 * * *", () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info("----Every12HoursJob Start Executing----");
            yield util_1.execJob(60 * 720);
        }));
        // every 4 hours
        schedule.scheduleJob("0 */4 * * *", () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info("----Every4HourJob Start Executing----");
            yield util_1.execJob(60 * 240);
        }));
        // every 2 hours
        schedule.scheduleJob("0 */2 * * *", () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info("----Every2HoursJob Start Executing----");
            yield util_1.execJob(60 * 120);
        }));
        // every hour
        schedule.scheduleJob("0 * * * *", () => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info("----EveryHourJob Start Executing----");
            yield util_1.execJob(60 * 60);
            yield currency_1.getBtcMaxCandles();
            yield currency_1.getBtcLatestCandles();
        }));
    });
}
exports.startSchedule = startSchedule;
//# sourceMappingURL=index.js.map