export interface Instrument {
  instrument_id: string; // 合约ID，如BTC-USD-190322
  underlying_index: string; // 交易货币币种，如：BTC-USD-190322中的BTC
  quote_currency: string; // 计价货币币种，如：BTC-USD-190322中的USD
  tick_size: string; // 下单价格精度 0.01
  contract_val: string; // 合约面值 100
  listing: string; // 创建时间 '2019-09-06'
  delivery: string; // 结算时间 '2019-09-20'
  trade_increment: string; // futures 下单数量精度
  size_increment: string; // swap 下单数量精度
  alias: string; // 本周 this_week 次周 next_week 季度 quarter 永续 swap
  settlement_currency: string; // 盈亏结算和保证金币种，BTC
  contract_val_currency: string; // 合约面值计价币种
}

export type timestamp = string;
export type open = string;
export type high = string;
export type low = string;
export type close = string;
export type volume = string;
export type currency_volume = string;

export type Candle = [timestamp, open, high, low, close, volume, currency_volume];

export interface InstrumentCandleSchema {
  instrument_id: string; // 	合约ID (如果是交割合约：BTC-USDT-190322)
  underlying_index?: string; // 交易货币币种，如：BTC-USD-190322 中的BTC
  quote_currency?: string; // 计价货币币种，如：BTC-USD-190322 中的USD
  timestamp: Date; // 开始时间 ISO_8601
  open: number; // 开盘价
  high: number; // 最高价格
  low: number; // 	最低价格
  close: number; // 收盘价格
  volume: number; // 	交易量(张)
  currency_volume?: number; // 按币种折算的交易量
  alias?: string; // 本周 this_week 次周 next_week 季度 quarter 永续 swap
  granularity: number; // 60 180 300 900 1800 3600 7200 14400 21600 43200 86400 604800
}

export interface InstrumentReqOptions extends Instrument {
  start: string;
  end: string;
  granularity: number;
  instrument_id: string;
}

export enum Business {
  FUTURES = 'futures',
  SWAP = 'swap',
}

export enum Channel {
  FuturesInstrument = 'futures/instruments',
  FuturesTicker = 'futures/ticker',
  FuturesTrade = 'futures/trade',
  FuturesPriceRange = 'futures/price_range',
  FuturesDepth = 'futures/depth',
  FuturesMarkPrice = 'futures/mark_price',
}

export interface Ticker {
  instrument_id: String; // 合约ID，如 BTC-USD-180213 BTC-USD-SWAP
  last: Number; // 最新成交价
  best_ask: Number; // 卖一价
  best_bid: Number; // 买一价
  high_24h: Number; // 24小时最高价
  low_24h: Number; // 24小时最低价
  volume_24h: Number; // 24小时成交量（按张数统计）
  timestamp: Date; // 系统时间 ISO_8601
  open_interest: Number; // 持仓量
  open_24h: Number; // 24小时开盘价
  volume_token_24h: Number; // 	成交量（（按币统计） ）
}

export interface Trade {
  side: string; //成交方向（buy or sell）
  trade_id: string; //成交id
  price: string; //成交价格
  qty: string; //成交数量
  timestamp: string; //成交时间
  instrument_id: string; //合约ID BTC-USD-170310
}

export interface PriceRange {
  highest: string; //最高买价
  lowest: string; //最低卖价
  instrument_id: string; //合约名称，如BTC-USD-170310
  timestamp: string; //系统时间 ISO_8601
}

export interface Depth {
  instrument_id: string; //合约ID BTC-USD-170310
  asks: string[][]; //卖方深度 [411.8,10,8,4] 411.8为深度价格，10为此价格数量，8为此价格的强平单数量，4为此深度由几笔订单组成
  bids: string[][]; //买方深度
  timestamp: string; //系统时间 ISO_8601
  checksum: number; //检验和
}

export interface MarkPrice {
  instrument_id: string; //合约ID BTC-USD-170310
  mark_price: string; //标记价格
  timestamp: string; //系统时间 ISO_8601
}

export interface OkexWsMessage {
  arg: any;
  data: Ticker[] | Trade[] | PriceRange[] | Depth[] | MarkPrice[];
}

export enum CandleChannel {
  candle1W = 604800,
  candle1D = 86400,
  candle12H = 43200,
  candle6H = 21600,
  candle4H = 14400,
  candle2H = 7200,
  candle1H = 3600,
  candle30m = 1800,
  candle15m = 900,
  candle5m = 300,
}
