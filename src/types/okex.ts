import {
  openTime,
  open,
  high,
  low,
  close,
  volume,
  currency_volume,
} from './common';

export type OkxKline = [
  openTime,
  open,
  high,
  low,
  close,
  volume,
  currency_volume,
];

export enum OkxBusiness {
  FUTURES = 'futures',
  SWAP = 'swap',
}

export enum OkxInstType {
  SPOT = 'SPOT',
  SWAP = 'SWAP',
  FUTURES = 'FUTURES',
  OPTION = 'OPTION',
}

export enum OkxWsChannel {
  Instrument = 'instruments',
  Ticker = 'tickers',
  OpenInterest = 'open-interest',
  Trade = 'trades',
  FundingRate = 'funding-rate',
}

// *** 行情频道 ***
export interface OkxTicker {
  instId: string; // 合约ID，如 BTC-USD-180213 BTC-USD-SWAP
  instType: OkxInstType; // 产品类型
  last: any; // 最新成交价
  lastSz: any; // 最新成交的数量
  askPx: any; // 卖一价
  bidPx: any; // 买一价
  open24h: any; // 24小时开盘价
  high24h: any; // 24小时最高价
  low24h: any; // 24小时最低价
  vol24h: any; // 24小时成交量（按张数统计）如果是衍生品合约，数值为合约的张数. 如果是币币/币币杠杆，数值为交易货币的数量.
  volCcy24h: any; // 24小时成交量（按币统计）
  sodUtc0: any; // UTC 0 时开盘价
  sodUtc8: any; // UTC+8 时开盘价
  ts: any; // 数据产生时间，Unix时间戳的毫秒数格式，如 1597026383085
}

export interface OkxWsTicker {
  instId: string; // 合约ID，如 BTC-USD-180213 BTC-USD-SWAP
  instType: OkxInstType; // 产品类型
  last: any; // 最新成交价
  lastSz: any; // 最新成交的数量
  askPx: any; // 卖一价
  bidPx: any; // 买一价
  open24h: any; // 24小时开盘价
  high24h: any; // 24小时最高价
  low24h: any; // 24小时最低价
  vol24h: any; // 24小时成交量（按张数统计）如果是衍生品合约，数值为合约的张数. 如果是币币/币币杠杆，数值为交易货币的数量.
  volCcy24h: any; // 24小时成交量（按币统计）
  sodUtc0: any; // UTC 0 时开盘价
  sodUtc8: any; // UTC+8 时开盘价
  ts: any; // 数据产生时间，Unix时间戳的毫秒数格式，如 1597026383085
}

// *** 持仓总量频道 ***
export interface OkxWsOpenInterest {
  instId: string; // 合约ID，如 BTC-USD-180213 BTC-USD-SWAP
  instType: OkxInstType; // 产品类型
  oi: string; // 持仓量，按张为单位，open interest
  oiCcy: string; // 持仓量，按币为单位
  ts: string; // 数据更新的时间，Unix时间戳的毫秒数格式，如 1597026383085
}

// *** K线频道 ***
export type OkxWsKline = [
  openTime,
  open,
  high,
  low,
  close,
  volume,
  currency_volume,
];

// *** 交易频道 ***
export interface OkxWsTrade {
  instId: string; // 合约ID，如 BTC-USD-180213 BTC-USD-SWAP
  trade_id: string; // 成交id
  px: string; // 成交价格
  sz: string; // 成交数量
  side: string; // 成交方向（buy or sell）
  ts: string; // 成交时间
}

// *** 资金费率频道 ***
export interface OkxWsFundingRate {
  instId: string; // 合约ID，如 BTC-USD-180213 BTC-USD-SWAP
  instType: OkxInstType; // 产品类型
  fundingRate: string; // 资金费率
  nextFundingRate: string; // 下一期预测资金费率
  fundingTime: string; // 最新的到期结算的资金费时间，Unix时间戳的毫秒数格式，如 1597026383085
}

export enum KlineInterval {
  candle1w = 604800,
  candle1d = 86400,
  candle12h = 43200,
  candle6h = 21600,
  candle4h = 14400,
  candle2h = 7200,
  candle1h = 3600,
  candle30m = 1800,
  candle15m = 900,
  candle5m = 300,
}

export interface OkxWsMsg {
  event?: string;
  arg: any;
  data: any[];
}

export interface OkxInst {
  instType: string;
  instId: string;
  uly: string;
  category: string;
  baseCcy: string;
  quoteCcy: string;
  settleCcy: string;
  ctVal: string;
  ctMult: string;
  ctValCcy: string;
  optType: string;
  stk: string;
  listTime: string;
  expTime: string;
  lever: string;
  tickSz: string;
  lotSz: string;
  minSz: string;
  ctType: string;
  alias: string;
  state: string;
}
