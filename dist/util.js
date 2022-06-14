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
exports.getMemoryUsage = exports.getNumber = exports.refreshOkxTradeInfo = exports.isMainCurrency = exports.isCandleChannel = exports.isValidMarketData = exports.getHoursAgo = exports.getCountByHoursAgo = exports.getTimestamp = exports.getISOString = exports.getKlineReqOptions = exports.getInstrumentAlias = exports.wait = exports.sleep = void 0;
const moment = require("moment");
const process_1 = require("process");
function sleep(seconds) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    });
}
exports.sleep = sleep;
function wait(seconds) {
    let ChildProcess_ExecSync = require('child_process').execSync;
    ChildProcess_ExecSync('sleep ' + seconds);
}
exports.wait = wait;
function getInstrumentAlias(instrumentId) {
    if (instrumentId.includes('SWAP')) {
        return 'swap';
    }
    const thisWeek = moment().day(5).format('YYMMDD');
    const nextWeek = moment().day(12).format('YYMMDD');
    if (instrumentId.includes(thisWeek)) {
        return 'this_week';
    }
    if (instrumentId.includes(nextWeek)) {
        return 'next_week';
    }
    return 'quarter';
}
exports.getInstrumentAlias = getInstrumentAlias;
function getStartEndOptions(size) {
    return [
        { start: getTimestamp(-200 * size, 'm'), end: getTimestamp() },
        {
            start: getTimestamp(-400 * size, 'm'),
            end: getTimestamp(-200 * size, 'm'),
        },
        {
            start: getTimestamp(-600 * size, 'm'),
            end: getTimestamp(-400 * size, 'm'),
        },
        {
            start: getTimestamp(-800 * size, 'm'),
            end: getTimestamp(-600 * size, 'm'),
        },
        {
            start: getTimestamp(-1000 * size, 'm'),
            end: getTimestamp(-800 * size, 'm'),
        },
        {
            start: getTimestamp(-1200 * size, 'm'),
            end: getTimestamp(-1000 * size, 'm'),
        },
        {
            start: getTimestamp(-1400 * size, 'm'),
            end: getTimestamp(-1200 * size, 'm'),
        },
        {
            start: getTimestamp(-1600 * size, 'm'),
            end: getTimestamp(-1400 * size, 'm'),
        },
        {
            start: getTimestamp(-1800 * size, 'm'),
            end: getTimestamp(-1600 * size, 'm'),
        },
        {
            start: getTimestamp(-2000 * size, 'm'),
            end: getTimestamp(-1800 * size, 'm'),
        },
    ].map((option) => {
        return Object.assign({}, option, {
            granularity: 60 * size,
        });
    });
}
function getKlineReqOptions() {
    const oneMinute = getStartEndOptions(1);
    const threeMinutes = getStartEndOptions(3);
    const fiveMinutes = getStartEndOptions(5);
    const fifteenMinutes = getStartEndOptions(15);
    const thirtyMinutes = getStartEndOptions(30);
    const oneHour = getStartEndOptions(60);
    const twoHours = getStartEndOptions(120);
    const fourHours = getStartEndOptions(240);
    const sixHours = getStartEndOptions(360);
    const twelveHours = getStartEndOptions(720);
    const day = getStartEndOptions(1440);
    return oneMinute
        .concat(threeMinutes)
        .concat(fiveMinutes)
        .concat(fifteenMinutes)
        .concat(thirtyMinutes)
        .concat(oneHour)
        .concat(twoHours)
        .concat(fourHours)
        .concat(sixHours)
        .concat(twelveHours)
        .concat(day);
}
exports.getKlineReqOptions = getKlineReqOptions;
function getISOString(amount = 0, unit = 'm') {
    return moment().add(amount, unit).toISOString();
}
exports.getISOString = getISOString;
function getTimestamp(amount = 0, unit = 'm') {
    return +moment().add(amount, unit);
}
exports.getTimestamp = getTimestamp;
function getCountByHoursAgo(hours = 0, granu) {
    return parseInt((hours * 60 * 60) / granu + '');
}
exports.getCountByHoursAgo = getCountByHoursAgo;
function getHoursAgo(hours = 0) {
    return +moment().add(-hours, 'h');
}
exports.getHoursAgo = getHoursAgo;
function isValidMarketData(marketData) {
    return !!('data' in marketData && marketData.data.length > 0);
}
exports.isValidMarketData = isValidMarketData;
function isCandleChannel(channel) {
    return !!(channel && channel.includes('candle'));
}
exports.isCandleChannel = isCandleChannel;
function isMainCurrency(name) {
    return ['BTC', 'LTC', 'ETH'].includes(name);
}
exports.isMainCurrency = isMainCurrency;
//更新实时盘口信息
function refreshOkxTradeInfo(memoryData, marketData) {
    const ticker = memoryData.find(({ instrument_id }) => {
        return instrument_id === marketData.data[0].instrument_id;
    });
    let data = marketData.data[0];
    if (ticker) {
        memoryData.map((item) => {
            if (ticker.instrument_id === item.instrument_id) {
                Object.assign(item, data);
            }
        });
    }
    else {
        memoryData.push(data);
    }
}
exports.refreshOkxTradeInfo = refreshOkxTradeInfo;
function getNumber(str) {
    return str.match(/\d+/)[0];
}
exports.getNumber = getNumber;
function getMemoryUsage() {
    const usage = process_1.memoryUsage();
    return {
        rss: (usage.rss / (1024 * 1024)).toFixed(2) + 'MB',
        heapTotal: (usage.heapTotal / (1024 * 1024)).toFixed(2) + 'MB',
        heapUsed: (usage.heapUsed / (1024 * 1024)).toFixed(2) + 'MB',
        arrayBuffers: (usage.arrayBuffers / (1024 * 1024)).toFixed(2) + 'MB',
    };
}
exports.getMemoryUsage = getMemoryUsage;
//# sourceMappingURL=util.js.map