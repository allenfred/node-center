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
const connection_1 = require("./database/connection");
const schedule_1 = require("./schedule");
const logger_1 = require("./logger");
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info("-----crawler start-----");
        //连接数据库
        yield connection_1.default();
        // 开启定时任务获取历史K线
        schedule_1.startSchedule();
    });
})();
//# sourceMappingURL=main.js.map