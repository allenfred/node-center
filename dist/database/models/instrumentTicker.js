"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// 公共-Ticker频道 https://www.okex.me/docs/zh/#futures_ws-ticker
const schema = new Schema({
    instrument_id: String,
    last: Number,
    best_ask: Number,
    best_bid: Number,
    high_24h: Number,
    low_24h: Number,
    volume_24h: Number,
    timestamp: Date,
    open_interest: Number,
    open_24h: Number,
    volume_token_24h: Number,
});
schema.index({ instrument_id: 1 }, { unique: true });
exports.InstrumentTicker = mongoose.model('instrument_tickers', schema);
//# sourceMappingURL=instrumentTicker.js.map