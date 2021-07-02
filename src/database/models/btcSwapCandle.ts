const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;

const schema = new Schema({
  instrument_id: String, // 	合约ID BTC-USD-SWAP / BTC-USDT-SWAP
  underlying_index: String, // 交易货币币种，如：BTC-USD-190322 中的BTC
  quote_currency: String, // 计价货币币种，如：BTC-USD-190322 中的USD
  timestamp: Date, // 开始时间 ISO_8601
  open: Number, // 开盘价
  high: Number, // 最高价格
  low: Number, // 	最低价格
  close: Number, // 收盘价格
  volume: Number, // 	交易量(张)
  currency_volume: Number, // 按币种折算的交易量
  granularity: Number, // 60 180 300 900 1800 3600 7200 14400 21600 43200 86400 604800
});

schema.index({ instrument_id: 1, timestamp: 1, granularity: 1 }, { unique: true });

export const BtcSwapCandle = mongoose.model('btc_swap_candles', schema);
