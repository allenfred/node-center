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
const moment = require("moment");
function sleep(seconds) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    });
}
exports.sleep = sleep;
function getInstrumentAlias(instrumentId) {
    if (instrumentId.includes('SWAP')) {
        return 'swap';
    }
    const thisWeek = moment()
        .day(5)
        .format('YYMMDD');
    const nextWeek = moment()
        .day(12)
        .format('YYMMDD');
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
        { start: getISOString(-200 * size, 'm'), end: getISOString() },
        {
            start: getISOString(-400 * size, 'm'),
            end: getISOString(-200 * size, 'm'),
        },
        {
            start: getISOString(-600 * size, 'm'),
            end: getISOString(-400 * size, 'm'),
        },
        {
            start: getISOString(-800 * size, 'm'),
            end: getISOString(-600 * size, 'm'),
        },
        {
            start: getISOString(-1000 * size, 'm'),
            end: getISOString(-800 * size, 'm'),
        },
        {
            start: getISOString(-1200 * size, 'm'),
            end: getISOString(-1000 * size, 'm'),
        },
        {
            start: getISOString(-1400 * size, 'm'),
            end: getISOString(-1200 * size, 'm'),
        },
        {
            start: getISOString(-1600 * size, 'm'),
            end: getISOString(-1400 * size, 'm'),
        },
        {
            start: getISOString(-1800 * size, 'm'),
            end: getISOString(-1600 * size, 'm'),
        },
        {
            start: getISOString(-2000 * size, 'm'),
            end: getISOString(-1800 * size, 'm'),
        },
    ].map(option => {
        return Object.assign({}, option, {
            granularity: 60 * size,
        });
    });
}
function getCandleRequestOptions() {
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
exports.getCandleRequestOptions = getCandleRequestOptions;
function getISOString(amount = 0, unit = 'm') {
    return moment()
        .add(amount, unit)
        .toISOString();
}
exports.getISOString = getISOString;
function isValidMarketData(marketData) {
    return !!('data' in marketData && marketData.data.length > 0);
}
exports.isValidMarketData = isValidMarketData;
function isCandleChannel(channel) {
    return !!(channel && channel.includes('candle'));
}
exports.isCandleChannel = isCandleChannel;
function isMainCurrency(name) {
    return ['BTC', 'EOS', 'ETH', 'BCH', 'LTC', 'BSV'].includes(name);
}
exports.isMainCurrency = isMainCurrency;
//更新实时盘口信息
function refreshTradeInfo(memoryData, marketData) {
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
exports.refreshTradeInfo = refreshTradeInfo;
//# sourceMappingURL=util.js.map