"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsdtSwapKline = void 0;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;
const schema = new Schema({
    instrument_id: String,
    underlying_index: String,
    timestamp: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
    currency_volume: Number,
    granularity: Number,
    exchange: { type: String, default: 'okex' },
});
schema.index({ exchange: 1, instrument_id: 1 });
schema.index({ instrument_id: 1, granularity: 1 });
schema.index({ exchange: 1, instrument_id: 1, granularity: 1 });
schema.index({ instrument_id: 1, timestamp: 1, granularity: 1, exchange: 1 }, { unique: true });
exports.UsdtSwapKline = mongoose.model('usdt_swap_klines', schema);
//# sourceMappingURL=usdtSwapKline.js.map