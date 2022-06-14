"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrumentTicker = void 0;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;
// 公共-Ticker频道 https://www.okex.me/docs/zh/#futures_ws-ticker
const schema = new Schema({
    instrument_id: String,
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
    exchange: { type: String, default: 'okex' },
});
schema.index({ instrument_id: 1, exchange: 1 }, { unique: true });
exports.InstrumentTicker = mongoose.model('instrument_tickers', schema);
//# sourceMappingURL=instrumentTicker.js.map