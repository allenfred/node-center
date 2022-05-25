export type timestamp = any;
export type openTime = timestamp;
export type closeTime = timestamp;
export type open = string;
export type high = string;
export type low = string;
export type close = string;
export type volume = string;
export type currency_volume = string;

export interface Instrument {
  instrument_id: string; // 合约ID，如BTC-USD-190322
  underlying_index: string; // 交易货币币种，如：BTC-USD-190322中的BTC
  quote_currency?: string; // 计价货币币种，如：BTC-USD-190322中的USD
  tick_size: string; // 下单价格精度 0.01
  contract_val: string; // 合约面值 100
  listing: string; // 创建时间 '2019-09-06'
  delivery: string; // 结算时间 '2019-09-20'
  trade_increment: string; // futures 下单数量精度
  size_increment: string; // swap 下单数量精度
  alias: string; // 本周 this_week 次周 next_week 季度 quarter 永续 swap
  settlement_currency: string; // 盈亏结算和保证金币种，BTC
  contract_val_currency: string; // 合约面值计价币种
  exchange: Exchange;
  klines?: number; // k线数据是否ready
}

export interface InstTicker {
  instrument_id: string; // 合约ID，如 BTC-USD-180213 BTC-USD-SWAP
  last: string; // 最新成交价
  chg_24h: any; // 24小时价格变化
  chg_rate_24h: any; // 24小时价格变化(百分比)
  high_24h: string; // 24小时最高价
  low_24h: string; // 24小时最低价
  volume_24h: string; // 24小时成交量（按张数统计）
  timestamp: string; // 系统时间 ISO_8601
  open_interest: string; // 持仓量
  open_24h: string; // 24小时开盘价
  volume_token_24h: string; // 	成交量（按币统计）
  exchange: Exchange;
}

export interface InstKline {
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
  exchange: string; // okex / biance
}

export interface InstReqOptions extends Instrument {
  start: string;
  end: string;
  granularity: number;
  instId: string;
  exchange: Exchange;
}

export enum Exchange {
  Okex = 'okex',
  Biance = 'biance',
}

export interface KlineReqOpts {
  instrumentId: string;
  start: any;
  end: any;
  granularity: number;
  exchange?: Exchange;
}

export type WsFormatKline = [
  openTime,
  open,
  high,
  low,
  close,
  volume,
  currency_volume,
];

export interface HistoryKlinesJobsOpts {
  days?: number;
  hours?: number;
  count?: number;
  start?: number;
  end?: number;
  delay?: number;
  includeInterval?: number[];
  excludeInterval?: number[];
}
