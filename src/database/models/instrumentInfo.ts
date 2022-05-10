var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;

// 公共-全量合约信息频道 https://www.okex.me/docs/zh/#futures_ws-order
const schema = new Schema({
  instrument_id: String, // 合约ID，如BTC-USD-180213
  underlying_index: String, // 交易货币币种，如：btc-usd中的btc
  quote_currency: String, // 计价货币币种，如：btc-usd中的usd
  tick_size: Number, // 下单价格精度
  contract_val: Number, // 合约面值(美元)
  listing: Date, // 上线日期
  delivery: Date, // 交割日期
  trade_increment: Number, // futures 下单数量精度
  size_increment: String, // swap 下单数量精度
  alias: String, // 本周 this_week 次周 next_week 季度 quarter 永续 swap
  exchange: { type: String, default: 'okex' }, // okex/biance/bybit
  klines: Number, // klines数据是否ready 1 / 0
});

schema.index({ instrument_id: 1, exchange: 1 }, { unique: true });

export const InstrumentInfo = mongoose.model('instrument_infos', schema);
