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
const futures = require("./futures");
const swap = require("./swap");
function initOkexMarketMonitor() {
    return __awaiter(this, void 0, void 0, function* () {
        // 获取所有合约信息
        const futuresInstruments = yield futures.initInstruments();
        const swapInstruments = yield swap.initInstruments();
        // 开启定时任务获取历史K线
        // startSchedule(futuresInstruments, swapInstruments);
        // 初始化获取所有合约K线
        yield futures.initCandle(futuresInstruments);
        yield swap.initCandle(swapInstruments);
    });
}
exports.initOkexMarketMonitor = initOkexMarketMonitor;
//# sourceMappingURL=index.js.map