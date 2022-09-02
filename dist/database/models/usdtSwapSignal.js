"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsdtSwapSignal = void 0;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;
const schema = new Schema({
    instrument_id: String,
    underlying_index: String,
    timestamp: Date,
    granularity: Number,
    exchange: { type: String, default: 'okex' },
});
schema.index({ exchange: 1, instrument_id: 1 });
schema.index({ exchange: 1, instrument_id: 1, granularity: 1 });
schema.index({ instrument_id: 1, timestamp: 1, granularity: 1, exchange: 1 }, { unique: true });
exports.UsdtSwapSignal = mongoose.model('usdt_swap_signals', schema);
//# sourceMappingURL=usdtSwapSignal.js.map