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
const logger_1 = require("../logger");
//设置系统限速规则: (okex官方API 限速规则：20次/2s)
function startSchedule() {
    schedule.scheduleJob("*/5 * * * *", () => __awaiter(this, void 0, void 0, function* () {
        const currentDate = new Date();
        if (util_1.isDailyScheduleTime(currentDate)) {
            logger_1.default.info("----执行 日线 K线定时任务----");
            yield util_1.execJob(60 * 1440);
        }
        if (util_1.isTwelveHoursScheduleTime(currentDate)) {
            logger_1.default.info("----执行 12小时 K线定时任务----");
            yield util_1.execJob(60 * 720);
        }
        if (util_1.isSixHoursScheduleTime(currentDate)) {
            logger_1.default.info("----执行 6小时 K线定时任务----");
            yield util_1.execJob(60 * 360);
        }
        if (util_1.isFourHoursScheduleTime(currentDate)) {
            logger_1.default.info("----执行 4小时 K线定时任务----");
            yield util_1.execJob(60 * 240);
        }
        if (util_1.isTwoHoursScheduleTime(currentDate)) {
            logger_1.default.info("----执行 2小时 K线定时任务----");
            yield util_1.execJob(60 * 120);
        }
        if (util_1.isHourlyScheduleTime(currentDate)) {
            logger_1.default.info("----执行 1小时 K线定时任务----");
            yield util_1.execJob(60 * 60);
        }
        if (util_1.isThirtyMinutesScheduleTime(currentDate)) {
            logger_1.default.info("----执行 30分钟 K线定时任务----");
            yield util_1.execJob(60 * 30);
        }
        if (util_1.isFifteenMinutesScheduleTime(currentDate)) {
            logger_1.default.info("----执行 15分钟 K线定时任务----");
            yield util_1.execJob(60 * 15);
        }
        if (util_1.isFiveMinutesScheduleTime(currentDate)) {
            logger_1.default.info("----执行 5分钟 K线定时任务----");
            yield util_1.execJob(60 * 5);
        }
        logger_1.default.info("----执行 1分钟 K线定时任务----");
        yield util_1.execJob(60);
    }));
    // every week.
    schedule.scheduleJob("0 0 * * 0", () => {
        logger_1.default.info("----执行 周线 K线定时任务----");
        util_1.execJob(60 * 1440 * 7);
    });
}
exports.startSchedule = startSchedule;
//# sourceMappingURL=index.js.map