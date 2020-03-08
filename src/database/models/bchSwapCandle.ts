const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;

const schema = new Schema({
  instrument_id: String, // 	合约ID BCH-USD-SWAP
  underlying_index: String, // 交易货币币种，BCH
  quote_currency: String, // 计价货币币种，USD
  timestamp: Date, // 开始时间 ISO_8601
  open: Number, // 开盘价
  high: Number, // 最高价格
  low: Number, // 	最低价格
  close: Number, // 收盘价格
  volume: Number, // 	交易量(张)
  currency_volume: Number, // 按币种折算的交易量
  granularity: Number // 60 180 300 900 1800 3600 7200 14400 21600 43200 86400 604800
});

schema.index({ timestamp: 1, granularity: 1 }, { unique: true });

export const BchSwapCandle = mongoose.model("bch_swap_candles", schema);
