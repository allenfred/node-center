var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;

// 公共-全量合约信息频道 https://www.okex.me/docs/zh/#futures_ws-order
const schema = new Schema({
  exchange: { type: String, default: 'okex' }, // okex/binance/bybit
  instrument_id: String, // 合约ID，如BTC-USD-180213
  base_currency: String, // 交易货币币种，如：btc-usd中的btc
  quote_currency: String, // 计价货币币种，如：btc-usd中的usd
  status: String, // Trading
  tick_size: Number, // 下单价格精度
  contract_val: Number, // 合约面值(美元)
  listing: Date, // 上线日期
  delivery: Date, // 交割日期
  size_increment: String, // swap 下单数量精度
  last: Number, // 最新成交价
  high_24h: Number, // 24小时最高价
  low_24h: Number, // 24小时最低价
  chg_24h: Number, // 24小时价格变化
  chg_rate_24h: Number, // 24小时价格变化(百分比)
  volume_24h: Number, // 24小时成交量（按张数统计）
  timestamp: Date, // 系统时间 ISO_8601
  open_interest: Number, // 持仓量
  open_24h: Number, // 24小时开盘价
  volume_token_24h: Number, // 	成交量（（按币统计） ）
  alias: String, // 本周 this_week 次周 next_week 季度 quarter 永续 swap
  klines: Number, // klines数据是否ready 1 / 0
});

schema.index({ instrument_id: 1, exchange: 1 }, { unique: true });

export const InstrumentInfo = mongoose.model('instrument_infos', schema);
