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
        const futureOptions = futuresInstruments
            .filter((i) => ['EOS', 'ETH', 'LTC', 'BCH'].includes(i.underlying_index))
            .map((i) => {
            return Object.assign({}, i, {
                start: util_1.getISOString((-200 * granularity) / 60, 'm'),
                end: new Date().toISOString(),
                granularity,
                alias: util_1.getInstrumentAlias(i.instrument_id),
            });
        });
        const swapOptions = swapInstruments
            .filter((i) => ['EOS', 'ETH', 'LTC', 'BCH'].includes(i.underlying_index))
            .map((i) => {
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
//# sourceMappingURL=util.js.map