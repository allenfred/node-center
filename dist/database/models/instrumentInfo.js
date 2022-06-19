"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrumentInfo = void 0;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;
// 公共-全量合约信息频道 https://www.okex.me/docs/zh/#futures_ws-order
const schema = new Schema({
    exchange: { type: String, default: 'okex' },
    instrument_id: String,
    base_currency: String,
    quote_currency: String,
    status: String,
    tick_size: Number,
    contract_val: Number,
    listing: Date,
    delivery: Date,
    size_increment: String,
    last: Number,
    high_24h: Number,
    low_24h: Number,
    chg_24h: Number,
    chg_rate_24h: Number,
    volume_24h: Number,
    timestamp: Date,
    open_interest: Number,
    open_24h: Number,
    volume_token_24h: Number,
    alias: String,
    klines: Number,
});
schema.index({ instrument_id: 1, exchange: 1 }, { unique: true });
exports.InstrumentInfo = mongoose.model('instrument_infos', schema);
//# sourceMappingURL=instrumentInfo.js.map