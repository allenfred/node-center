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
const logger_1 = require("../logger");
const dao_1 = require("../dao");
const util_1 = require("../util");
const common_1 = require("./common");
function initInstruments() {
    return __awaiter(this, void 0, void 0, function* () {
        //获取全量交割合约信息
        const instruments = yield common_1.getFuturesInstruments();
        logger_1.default.info(`[交割合约] - 获取公共交割合约全量信息成功，共: ${instruments.length} 条 ...`);
        //更新合约信息
        yield dao_1.InstrumentInfoDao.upsert(instruments);
        logger_1.default.info(`[交割合约] - 公共交割合约全量信息更新数据库成功 ...`);
        return instruments;
    });
}
exports.initInstruments = initInstruments;
function initCandle(instruments) {
    return __awaiter(this, void 0, void 0, function* () {
        //获取所有时间粒度请求参数 如[60/180/300 900/1800/3600/7200/14400/21600/43200/86400]
        const options = util_1.getCandleRequestOptions();
        const readyOptions = [];
        //初始化所有合约candle请求参数
        instruments
            // .filter(i => isMainCurrency(i.underlying_index))
            .map((instrument) => {
            for (let option of options) {
                readyOptions.push(Object.assign({}, option, instrument));
            }
        });
        logger_1.default.info(`获取合约candle数据需请求 ${readyOptions.length} 次 ...`);
        yield common_1.getCandlesWithLimitedSpeed(readyOptions);
    });
}
exports.initCandle = initCandle;
//# sourceMappingURL=futures.js.map