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
    alias: String,
    granularity: Number,
});
schema.index({ underlying_index: 1, alias: 1, timestamp: 1, granularity: 1 }, { unique: true });
exports.InstrumentCandle = mongoose.model('instrument_candles', schema);
//# sourceMappingURL=instrumentCandle.js.map