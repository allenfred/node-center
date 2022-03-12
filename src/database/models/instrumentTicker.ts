var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { String, Number, Date } = Schema.Types;

// 公共-Ticker频道 https://www.okex.me/docs/zh/#futures_ws-ticker
const schema = new Schema({
  instrument_id: String, // 合约ID，如 BTC-USD-180213 BTC-USD-SWAP
  last: Number, // 最新成交价
  best_ask: Number, // 卖一价
  best_bid: Number, // 买一价
  high_24h: Number, // 24小时最高价
  low_24h: Number, // 24小时最低价
  volume_24h: Number, // 24小时成交量（按张数统计）
  timestamp: Date, // 系统时间 ISO_8601
  open_interest: Number, // 持仓量
  open_24h: Number, // 24小时开盘价
  volume_token_24h: Number, // 	成交量（（按币统计） ）
  exchange: { type: String, default: 'okex' }, // okex/biance/bybit
});

schema.index({ instrument_id: 1, exchange: 1 }, { unique: true });

export const InstrumentTicker = mongoose.model('instrument_tickers', schema);
