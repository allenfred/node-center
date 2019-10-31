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
const connection_1 = require("./database/connection");
const futures = require("./okex/futures");
const swap = require("./okex/swap");
const schedule_1 = require("./schedule");
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        //连接数据库
        yield connection_1.default();
        // 获取所有合约信息
        const futuresInstruments = yield futures.initInstruments();
        const swapInstruments = yield swap.initInstruments();
        // 开启定时任务获取历史K线
        schedule_1.startSchedule(futuresInstruments, swapInstruments);
    });
})();
//# sourceMappingURL=main.js.map