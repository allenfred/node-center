"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
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
});
schema.index({ underlying_index: 1, quote_currency: 1, alias: 1 }, { unique: true });
exports.InstrumentInfo = mongoose.model('instrument_infos', schema);
//# sourceMappingURL=instrumentInfo.js.map