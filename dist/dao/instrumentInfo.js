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
const bluebird = require("bluebird");
const models_1 = require("../database/models");
function upsert(instruments) {
    return __awaiter(this, void 0, void 0, function* () {
        return bluebird.map(instruments, (item) => __awaiter(this, void 0, void 0, function* () {
            //find unique candle by underlying_index & quote_currency & alias.
            const uniqueCondition = {
                underlying_index: item.underlying_index,
                quote_currency: item.quote_currency,
                alias: item.alias,
            };
            let result;
            const one = yield models_1.InstrumentInfo.findOne(uniqueCondition);
            if (one) {
                result = yield models_1.InstrumentInfo.updateOne(uniqueCondition, item);
            }
            else {
                result = yield models_1.InstrumentInfo.create(item);
            }
            return result;
        }));
    });
}
const InstrumentInfoDao = {
    upsert,
};
exports.InstrumentInfoDao = InstrumentInfoDao;
//# sourceMappingURL=instrumentInfo.js.map