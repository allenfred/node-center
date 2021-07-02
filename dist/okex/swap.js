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
const common_1 = require("./common");
function initInstruments() {
    return __awaiter(this, void 0, void 0, function* () {
        //获取全量永续合约信息
        const instruments = yield common_1.getSwapInstruments();
        logger_1.default.info(`[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`);
        //更新永续合约信息
        yield dao_1.InstrumentInfoDao.upsert(instruments);
        logger_1.default.info(`[永续合约] - 公共合约全量信息更新数据库成功 ...`);
        return instruments;
    });
}
exports.initInstruments = initInstruments;
//# sourceMappingURL=swap.js.map