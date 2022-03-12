const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;

const schema = new Schema({
  instrument_id: String, //  BTC-USDT
  timestamp: Date, // 开始时间 ISO_8601
  open: Number, // 开盘价
  high: Number, // 最高价格
  low: Number, // 	最低价格
  close: Number, // 收盘价格
  volume: Number, // 	交易量
  granularity: Number, // 60 180 300 900 1800 3600 7200 14400 21600 43200 86400 604800
  exchange: { type: String, default: 'okex' }, // okex/biance/bybit
});

schema.index({ timestamp: 1, granularity: 1, exchange: 1 }, { unique: true });

export const btcUsdtKline = mongoose.model('btc_usdt_klines', schema);
