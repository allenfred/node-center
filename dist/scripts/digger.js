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
const connection_1 = require("../database/connection");
const commonAPI = require("../api/common");
const binance_1 = require("../api/binance");
const logger_1 = require("../logger");
const types_1 = require("../types");
const Binance = require("../api/binance");
/**
 * -i: init instruments
 *
 * -e: getExchangeInfo
 *
 * -k: get klines
 *     -t interval
 *
 */
const myArgs = process.argv.slice(2);
const startJob = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!myArgs.length) {
        logger_1.default.info('缺少参数');
        return;
    }
    const startTime = new Date().getTime();
    yield connection_1.default();
    if (myArgs[0] === '-i') {
        const data = yield Binance.initInstruments();
        data.map((i) => { });
    }
    if (myArgs[0] === '-e') {
        const data = yield binance_1.getExchangeInfo();
        console.log(data.rateLimits);
    }
    if (myArgs[0] === '-k') {
        const instId = myArgs[1].toUpperCase();
        if (instId.endsWith('SWAP')) {
            yield commonAPI.getOkexKlines(commonAPI.getKlinesReqParams({
                exchange: types_1.Exchange.Okex,
                instId,
                count: 1500,
            }));
        }
        if (instId.endsWith('USDT')) {
            yield commonAPI.getBinanceKlines(commonAPI.getKlinesReqParams({
                exchange: types_1.Exchange.Binance,
                instId,
                count: 1500,
            }));
            yield commonAPI.getBybitKlines(commonAPI.getKlinesReqParams({
                exchange: types_1.Exchange.Bybit,
                instId,
                count: 1500,
            }));
        }
    }
    const endTime = new Date().getTime();
    const usedTime = ((endTime - startTime) / 1000).toFixed(1);
    logger_1.default.info(`----- Job End Time Used: ${usedTime}s -----`);
    process.exit(0);
});
startJob();
//# sourceMappingURL=digger.js.map