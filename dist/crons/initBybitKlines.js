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
const dao_1 = require("../dao");
const bybit_1 = require("../api/bybit");
const types_1 = require("../types");
const logger_1 = require("../logger");
const { LinearClient } = require('bybit-api');
const util_1 = require("./util");
const args = process.argv.slice(2);
const API_KEY = null;
const PRIVATE_KEY = null;
const useLivenet = true;
const client = new LinearClient(API_KEY, PRIVATE_KEY, 
// optional, uses testnet by default. Set to 'true' to use livenet.
useLivenet);
//设置系统限速规则: (bybit官方API 限速规则：20次/s)
// */5 * * * * At every 5 minute.
exports.startJob = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('---- Init Bybit Klines Job Start Executing ----');
    const startTime = new Date().getTime();
    const opt = util_1.getCommandOpts(args);
    yield connection_1.default();
    const insts = yield dao_1.InstrumentInfoDao.findAll().then((inst) => {
        return inst.filter((i) => i.exchange === types_1.Exchange.Bybit);
    });
    yield bybit_1.getHistoryKlines(insts, opt);
    const endTime = new Date().getTime();
    const usedTime = ((endTime - startTime) / 1000).toFixed(1);
    logger_1.default.info(`----- Job End Time Used: ${usedTime}s -----`);
    process.exit(0);
});
exports.startJob();
//# sourceMappingURL=initBybitKlines.js.map