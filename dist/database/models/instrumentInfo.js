"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrumentInfo = void 0;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;
// 公共-全量合约信息频道 https://www.okex.me/docs/zh/#futures_ws-order
const schema = new Schema({
    instrument_id: String,
    underlying_index: String,
    quote_currency: String,
    tick_size: Number,
    contract_val: Number,
    listing: Date,
    delivery: Date,
    trade_increment: Number,
    size_increment: String,
    alias: String,
    exchange: { type: String, default: 'okex' },
    klines: Number,
});
schema.index({ instrument_id: 1, exchange: 1 }, { unique: true });
exports.InstrumentInfo = mongoose.model('instrument_infos', schema);
//# sourceMappingURL=instrumentInfo.js.map