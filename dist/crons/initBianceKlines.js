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
exports.startJob = void 0;
const connection_1 = require("../database/connection");
const biance_1 = require("../api/biance");
const logger_1 = require("../logger");
const util_1 = require("./util");
const args = process.argv.slice(2);
//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// */5 * * * * At every 5 minute.
exports.startJob = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('---- Init Biance Klines Job Start Executing ----');
    const startTime = new Date().getTime();
    const opt = util_1.getCommandOpts(args);
    yield connection_1.default();
    const insts = yield biance_1.initInstruments();
    yield biance_1.getHistoryKlines(insts, opt);
    const endTime = new Date().getTime();
    const usedTime = ((endTime - startTime) / 1000).toFixed(1);
    logger_1.default.info(`----- Job End Time Used: ${usedTime}s -----`);
    process.exit(0);
});
exports.startJob();
//# sourceMappingURL=initBianceKlines.js.map