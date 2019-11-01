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
const common_1 = require("../okex/common");
const futures = require("../okex/futures");
const swap = require("../okex/swap");
const util_1 = require("../util");
//设置系统限速规则: (okex官方API 限速规则：20次/2s)
function execJob(granularity) {
    return __awaiter(this, void 0, void 0, function* () {
        // 获取所有合约信息
        const futuresInstruments = yield futures.initInstruments();
        const swapInstruments = yield swap.initInstruments();
        const futureOptions = futuresInstruments.map(i => {
            return Object.assign({}, i, {
                start: util_1.getISOString((-200 * granularity) / 60, 'm'),
                end: new Date().toISOString(),
                granularity,
                alias: util_1.getInstrumentAlias(i.instrument_id),
            });
        });
        const swapOptions = swapInstruments.map(i => {
            return Object.assign({}, i, {
                start: util_1.getISOString((-200 * granularity) / 60, 'm'),
                end: new Date().toISOString(),
                granularity,
                alias: util_1.getInstrumentAlias(i.instrument_id),
            });
        });
        return yield common_1.getCandlesWithLimitedSpeed(futureOptions.concat(swapOptions));
    });
}
exports.execJob = execJob;
function isDailyScheduleTime(date) {
    return +date.getHours() % 24 && +date.getMinutes() === 0 ? true : false;
}
exports.isDailyScheduleTime = isDailyScheduleTime;
function isTwelveHoursScheduleTime(date) {
    return +date.getHours() % 12 && +date.getMinutes() === 0 ? true : false;
}
exports.isTwelveHoursScheduleTime = isTwelveHoursScheduleTime;
function isSixHoursScheduleTime(date) {
    return +date.getHours() % 6 && +date.getMinutes() === 0 ? true : false;
}
exports.isSixHoursScheduleTime = isSixHoursScheduleTime;
function isFourHoursScheduleTime(date) {
    return +date.getHours() % 4 && +date.getMinutes() === 0 ? true : false;
}
exports.isFourHoursScheduleTime = isFourHoursScheduleTime;
function isTwoHoursScheduleTime(date) {
    return +date.getHours() % 2 && +date.getMinutes() === 0 ? true : false;
}
exports.isTwoHoursScheduleTime = isTwoHoursScheduleTime;
function isHourlyScheduleTime(date) {
    return +date.getMinutes() === 0 ? true : false;
}
exports.isHourlyScheduleTime = isHourlyScheduleTime;
function isThirtyMinutesScheduleTime(date) {
    return +date.getMinutes() % 30 === 0 ? true : false;
}
exports.isThirtyMinutesScheduleTime = isThirtyMinutesScheduleTime;
function isFifteenMinutesScheduleTime(date) {
    return +date.getMinutes() % 15 === 0 ? true : false;
}
exports.isFifteenMinutesScheduleTime = isFifteenMinutesScheduleTime;
function isFiveMinutesScheduleTime(date) {
    return +date.getMinutes() % 5 === 0 ? true : false;
}
exports.isFiveMinutesScheduleTime = isFiveMinutesScheduleTime;
function isThreeMinutesScheduleTime(date) {
    return +date.getMinutes() % 3 === 0 ? true : false;
}
exports.isThreeMinutesScheduleTime = isThreeMinutesScheduleTime;
//# sourceMappingURL=util.js.map