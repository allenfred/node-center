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
exports.getCommandOpts = exports.execJob = exports.Job_Granularity = void 0;
const util_1 = require("../util");
const models_1 = require("../database/models");
const types_1 = require("../types");
const Okex = require("../api/okex");
const Binance = require("../api/binance");
const Bybit = require("../api/bybit");
const lodash_1 = require("lodash");
const Job_Granularity = {
    FiveMins: 60 * 5,
    FifteenMins: 60 * 15,
    HalfHour: 60 * 30,
    OneHour: 60 * 60,
    TwoHour: 60 * 120,
    FourHour: 60 * 240,
    SixHour: 60 * 360,
    TwelveHour: 60 * 720,
    OneDay: 60 * 1440,
    Weekly: 60 * 1440 * 7,
};
exports.Job_Granularity = Job_Granularity;
//设置系统限速规则: (okex官方API 限速规则：20次/2s)
function execJob(granularity, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const hourNow = new Date().getHours();
        const minuteNow = new Date().getMinutes();
        // 获取所有合约信息
        const insts = yield models_1.InstrumentInfo.find({});
        // 5min / 30min / 2h / 6h / 1w
        const jobsForBtcOnly = [
            Job_Granularity.FiveMins,
            Job_Granularity.HalfHour,
            Job_Granularity.TwoHour,
            Job_Granularity.SixHour,
            Job_Granularity.Weekly,
        ];
        const customFilter = (i) => {
            if (jobsForBtcOnly.includes(granularity)) {
                return i.base_currency === 'BTC';
            }
            else {
                return i.quote_currency === 'USDT';
            }
        };
        const validInsts = lodash_1.sortBy(insts.filter(customFilter), ['instrument_id']);
        // 最近 4 条K线数据
        let count = limit || 4;
        if (minuteNow === 0 && granularity === Job_Granularity.FifteenMins) {
            count = 8;
        }
        // 每12h更新过去24h全量数据 (15mins, 1h)
        if (hourNow % 12 === 0 &&
            [Job_Granularity.FifteenMins, Job_Granularity.OneHour].includes(granularity)) {
            count = util_1.getCountByHoursAgo(24, granularity);
        }
        yield Promise.all([
            Okex.getHistoryKlines(validInsts.filter((i) => i.exchange === types_1.Exchange.Okex), {
                count,
                includeInterval: [granularity],
            }),
            Binance.getHistoryKlines(validInsts.filter((i) => i.exchange === types_1.Exchange.Binance), {
                count,
                delay: 300,
                includeInterval: [granularity],
            }),
            Bybit.getHistoryKlines(validInsts.filter((i) => i.exchange === types_1.Exchange.Bybit), {
                count,
                delay: 200,
                includeInterval: [granularity],
            }),
        ]);
    });
}
exports.execJob = execJob;
function getCommandOpts(args) {
    const opt = {};
    // param for instrument_id
    if (args.includes('-i') && args.length > args.indexOf('-i') + 1) {
        opt.includeInst = [args[args.indexOf('-i') + 1]];
    }
    // param for gran
    if (args.includes('-g') && args.length > args.indexOf('-g') + 1) {
        opt.includeInterval = [+args[args.indexOf('-g') + 1]];
    }
    // param for count
    if (args.includes('-n') && args.length > args.indexOf('-n') + 1) {
        opt.count = [+args[args.indexOf('-n') + 1]];
    }
    return opt;
}
exports.getCommandOpts = getCommandOpts;
//# sourceMappingURL=util.js.map