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
const swap = require("../okex/swap");
const util_1 = require("../util");
const Job_Granularity = {
    FiveMins: 60 * 5,
    FifteenMins: 60 * 15,
    HalfHour: 60 * 30,
    OneHour: 60 * 60,
    TwoHour: 60 * 120,
    FourHour: 60 * 240,
    OneDay: 60 * 1440,
};
exports.Job_Granularity = Job_Granularity;
//设置系统限速规则: (okex官方API 限速规则：20次/2s)
function execJob(granularity) {
    return __awaiter(this, void 0, void 0, function* () {
        // 获取所有合约信息
        const swapInstruments = yield swap.initInstruments();
        const swapOptions = swapInstruments
            // .filter((i) => ['BTC', 'ETH', 'LTC'].includes(i.underlying_index))
            .filter((i) => ['BTC'].includes(i.underlying_index))
            .map((i) => {
            return Object.assign({}, i, {
                start: util_1.getISOString((-200 * granularity) / 60, 'm'),
                end: new Date().toISOString(),
                granularity,
                alias: util_1.getInstrumentAlias(i.instrument_id),
            });
        });
        return yield common_1.getCandlesWithLimitedSpeed(swapOptions);
    });
}
exports.execJob = execJob;
//# sourceMappingURL=util.js.map