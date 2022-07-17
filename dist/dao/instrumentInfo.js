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
exports.InstrumentInfoDao = void 0;
const bluebird = require("bluebird");
const models_1 = require("../database/models");
function upsert(instruments) {
    return __awaiter(this, void 0, void 0, function* () {
        return bluebird.map(instruments, (item) => __awaiter(this, void 0, void 0, function* () {
            //find unique candle by underlying_index & quote_currency & alias.
            const uniqueCondition = {
                instrument_id: item.instrument_id,
                exchange: item.exchange,
            };
            return models_1.InstrumentInfo.updateOne(uniqueCondition, item, { upsert: true });
        }));
    });
}
function find(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield models_1.InstrumentInfo.find(opts);
    });
}
function findByTopVolume(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield models_1.InstrumentInfo.find({ exchange: opts.exchange }, null, {
            limit: opts.limit || 30,
            sort: { volume_24h: -1 },
        }).exec();
    });
}
function deleteByIds(instIds, exchange) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield models_1.InstrumentInfo.deleteMany({
            exchange,
            instrument_id: { $in: instIds },
        });
    });
}
function findAll() {
    return __awaiter(this, void 0, void 0, function* () {
        // 获取所有合约信息
        const insts = yield models_1.InstrumentInfo.aggregate([
            { $sort: { exchange: 1 } },
            {
                $group: {
                    _id: '$base_currency',
                    base_currency: { $first: '$base_currency' },
                    quote_currency: { $first: '$quote_currency' },
                    exchange: { $first: '$exchange' },
                    volume_24h: { $first: '$volume_24h' },
                    instrument_id: { $first: '$instrument_id' },
                },
            },
            { $sort: { volume_24h: -1 } },
            {
                $project: {
                    instrument_id: '$instrument_id',
                    base_currency: '$base_currency',
                    quote_currency: '$quote_currency',
                    exchange: '$exchange',
                    volume_24h: '$volume_24h',
                },
            },
        ]);
        return insts;
    });
}
const InstrumentInfoDao = {
    upsert,
    find,
    deleteByIds,
    findByTopVolume,
    findAll,
};
exports.InstrumentInfoDao = InstrumentInfoDao;
//# sourceMappingURL=instrumentInfo.js.map