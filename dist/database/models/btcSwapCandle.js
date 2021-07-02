"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;
const schema = new Schema({
    instrument_id: String,
    underlying_index: String,
    quote_currency: String,
    timestamp: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
    currency_volume: Number,
    granularity: Number,
});
schema.index({ instrument_id: 1, timestamp: 1, granularity: 1 }, { unique: true });
exports.BtcSwapCandle = mongoose.model('btc_swap_candles', schema);
//# sourceMappingURL=btcSwapCandle.js.map