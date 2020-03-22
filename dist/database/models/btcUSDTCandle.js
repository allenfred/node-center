"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;
const schema = new Schema({
    instrument_id: String,
    timestamp: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
    granularity: Number // 60 180 300 900 1800 3600 7200 14400 21600 43200 86400 604800
});
schema.index({ timestamp: 1, granularity: 1 }, { unique: true });
exports.btcUSDTCandle = mongoose.model("btc_usdt_candles", schema);
//# sourceMappingURL=btcUSDTCandle.js.map