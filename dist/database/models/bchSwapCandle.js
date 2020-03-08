"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
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
    granularity: Number // 60 180 300 900 1800 3600 7200 14400 21600 43200 86400 604800
});
schema.index({ timestamp: 1, granularity: 1 }, { unique: true });
exports.BchSwapCandle = mongoose.model("bch_swap_candles", schema);
//# sourceMappingURL=bchSwapCandle.js.map