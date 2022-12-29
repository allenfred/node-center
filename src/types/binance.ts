import {
  openTime,
  closeTime,
  open,
  high,
  low,
  close,
  volume,
  currency_volume,
} from './common';

export type BinanceKline = [
  openTime,
  open,
  high,
  low,
  close,
  volume,
  closeTime,
  currency_volume,
];

// stream名称中所有交易对均为小写
// !miniTicker@arr 全市场的精简Ticker
// !ticker@arr 全市场的完整Ticker

export enum BinanceWsStream {
  miniTicker = '!miniTicker@arr',
  ticker = '!ticker@arr',
}

// -------------- websocket Stream  -------------------

export interface BinanceWsMiniTicker {
  e: string; // 事件类型 24hrMiniTicker
  E: string; // 事件时间(毫秒) 123456789
  s: string; // 交易对  BTCUSDT
  c: string; // 最新成交价格
  o: string; // 24小时前开始第一笔成交价格
  h: string; // 24小时内最高成交价
  l: string; // 24小时内最低成交价
  v: string; // 成交量
  q: string; // 成交额
}

export interface BinanceWsMiniTickersMsg {
  stream: BinanceWsStream.miniTicker;
  data: BinanceWsMiniTicker[];
}

export interface BinanceWsTicker {
  e: string; // 事件类型 24hrTicker
  E: string; // 事件时间(毫秒) 123456789
  s: string; // 交易对  BTCUSDT
  p: string; // 24小时价格变化
  P: string; // 24小时价格变化(百分比)
  w: string; // 平均价格
  c: string; // 最新成交价格
  Q: string; // 最新成交价格上的成交量
  o: string; // 24小时内第一比成交的价格
  h: string; // 24小时内最高成交价
  l: string; // 24小时内最低成交价
  v: string; // 24小时内成交量
  q: string; // 24小时内成交额
  O: number; // 统计开始时间
  C: number; // 统计结束时间
  F: number; // 24小时内第一笔成交交易ID
  L: number; // 24小时内最后一笔成交交易ID
  n: number; // 24小时内成交数
}

export interface BinanceWsTickersMsg {
  stream: BinanceWsStream.ticker;
  data: BinanceWsTicker[];
}

export interface BinanceWsKline {
  t: any; // 时间戳
  s: string; // symbol
  i: string; // interval 1h / 4h
  o: string; // open
  c: string; // close
  h: string; // high
  l: string; // low
  v: string; // 成交量 以币种计量
  q: string; // 成交额 以USDT计量
}

// Payload:
/**
     * {
        "e": "kline",     // 事件类型
        "E": 123456789,   // 事件时间
        "s": "BNBUSDT",    // 交易对
        "k": {
          "t": 123400000, // 这根K线的起始时间
          "T": 123460000, // 这根K线的结束时间
          "s": "BNBUSDT",  // 交易对
          "i": "1m",      // K线间隔
          "f": 100,       // 这根K线期间第一笔成交ID
          "L": 200,       // 这根K线期间末一笔成交ID
          "o": "0.0010",  // 开盘价
          "c": "0.0020",  // 收盘价
          "h": "0.0025",  // 最高价
          "l": "0.0015",  // 最低价
          "v": "1000",    // 这根K线期间成交量
          "n": 100,       // 这根K线期间成交笔数
          "x": false,     // 这根K线是否完结(是否已经开始下一根K线)
          "q": "1.0000",  // 这根K线期间成交额
          "V": "500",     // 主动买入的成交量
          "Q": "0.500",   // 主动买入的成交额
          "B": "123456"   // 忽略此参数
        }
      }
    */
export interface BinanceWsKlineMsg {
  e: string; // 事件类型
  E: number; // 事件时间
  s: string; // 交易对
  k: {
    t: number; // 这根K线的起始时间
    T: number; // 这根K线的结束时间
    s: string; // 交易对
    i: string; // K线间隔
    f: number; // 这根K线期间第一笔成交ID
    L: number; // 这根K线期间末一笔成交ID
    o: string; // 开盘价
    c: string; // 收盘价
    h: string; // 最高价
    l: string; // 最低价
    v: string; // 这根K线期间成交量
    n: number; // 这根K线期间成交笔数
    x: boolean; // 这根K线是否完结(是否已经开始下一根K线)
    q: string; // 这根K线期间成交额
    V: string; // 主动买入的成交量
    Q: string; // 主动买入的成交额
    B: string; // 忽略此参数
  };
}

// -------------- websocket Stream  -------------------

/**
 * "symbols": [ // 交易对信息
        {
            "symbol": "BLZUSDT",  // 交易对
            "pair": "BLZUSDT",  // 标的交易对
            "contractType": "PERPETUAL",    // 合约类型
            "deliveryDate": 4133404800000,  // 交割日期
            "onboardDate": 1598252400000,     // 上线日期
            "status": "TRADING",  // 交易对状态
            "maintMarginPercent": "2.5000",  // 请忽略
            "requiredMarginPercent": "5.0000", // 请忽略
            "baseAsset": "BLZ",  // 标的资产
            "quoteAsset": "USDT", // 报价资产
            "marginAsset": "USDT", // 保证金资产
            "pricePrecision": 5,  // 价格小数点位数(仅作为系统精度使用，注意同tickSize 区分）
            "quantityPrecision": 0,  // 数量小数点位数(仅作为系统精度使用，注意同stepSize 区分）
            "baseAssetPrecision": 8,  // 标的资产精度
            "quotePrecision": 8,  // 报价资产精度
            "underlyingType": "COIN",
            "underlyingSubType": ["STORAGE"],
            "settlePlan": 0,
            "triggerProtect": "0.15", // 开启"priceProtect"的条件订单的触发阈值
            "filters": [
                {
                    "filterType": "PRICE_FILTER", // 价格限制
                    "maxPrice": "300", // 价格上限, 最大价格
                    "minPrice": "0.0001", // 价格下限, 最小价格
                    "tickSize": "0.0001" // 订单最小价格间隔
                },
                {
                    "filterType": "LOT_SIZE", // 数量限制
                    "maxQty": "10000000", // 数量上限, 最大数量
                    "minQty": "1", // 数量下限, 最小数量
                    "stepSize": "1" // 订单最小数量间隔
                },
                {
                    "filterType": "MARKET_LOT_SIZE", // 市价订单数量限制
                    "maxQty": "590119", // 数量上限, 最大数量
                    "minQty": "1", // 数量下限, 最小数量
                    "stepSize": "1" // 允许的步进值
                },
                {
                    "filterType": "MAX_NUM_ORDERS", // 最多订单数限制
                    "limit": 200
                },
                {
                    "filterType": "MAX_NUM_ALGO_ORDERS", // 最多条件订单数限制
                    "limit": 100
                },
                {
                    "filterType": "MIN_NOTIONAL",  // 最小名义价值
                    "notional": "1", 
                },
                {
                    "filterType": "PERCENT_PRICE", // 价格比限制
                    "multiplierUp": "1.1500", // 价格上限百分比
                    "multiplierDown": "0.8500", // 价格下限百分比
                    "multiplierDecimal": 4
                }
            ],
            "OrderType": [ // 订单类型
                "LIMIT",  // 限价单
                "MARKET",  // 市价单
                "STOP", // 止损单
                "STOP_MARKET", // 止损市价单
                "TAKE_PROFIT", // 止盈单
                "TAKE_PROFIT_MARKET", // 止盈暑市价单
                "TRAILING_STOP_MARKET" // 跟踪止损市价单
            ],
            "timeInForce": [ // 有效方式
                "GTC", // 成交为止, 一直有效
                "IOC", // 无法立即成交(吃单)的部分就撤销
                "FOK", // 无法全部立即成交就撤销
                "GTX" // 无法成为挂单方就撤销
            ],
            "liquidationFee": "0.010000",   // 强平费率
            "marketTakeBound": "0.30",  // 市价吃单(相对于标记价格)允许可造成的最大价格偏离比例
        }
    ]
 * 
*/
export interface BinanceSymbolInfo {
  symbol: string; // 交易对
  pair: string; // 标的交易对
  contractType: string; // 合约类型  PERPETUAL / CURRENT_QUARTER
  deliveryDate: number; // 交割日期  4133404800000
  onboardDate: number; // 上线日期 1598252400000
  status: string; // 交易对状态 TRADING
  baseAsset: string; // 标的资产 BLZ
  quoteAsset: string; // 报价资产 USDT
  marginAsset: string; // 保证金资产 USDT
  pricePrecision: number; // 价格小数点位数(仅作为系统精度使用，注意同tickSize 区分 5
  quantityPrecision: number; // 数量小数点位数(仅作为系统精度使用，注意同stepSize 区分） 0
  baseAssetPrecision: number; // 标的资产精度 8
  quotePrecision: number; // 报价资产精度
  underlyingType: string; // COIN
  underlyingSubType: string[]; // [STORAGE]
  settlePlan: number;
  triggerProtect: number; // 开启"priceProtect"的条件订单的触发阈值 0.15
  filters: Filter[];
}

export enum FilterType {
  PRICE_FILTER = 'PRICE_FILTER',
  LOT_SIZE = 'LOT_SIZE',
  MARKET_LOT_SIZE = 'MARKET_LOT_SIZE',
  MAX_NUM_ORDERS = 'MAX_NUM_ORDERS',
  MAX_NUM_ALGO_ORDERS = 'MAX_NUM_ALGO_ORDERS',
  MIN_NOTIONAL = 'MIN_NOTIONAL',
  PERCENT_PRICE = 'PERCENT_PRICE',
}

export interface Filter {
  filterType: FilterType; // 价格限制
  maxPrice: any; // 价格上限, 最大价格
  minPrice: any; // 价格下限, 最小价格
  tickSize: any; // 订单最小价格间隔
  maxQty: any; // 数量上限, 最大数量
  minQty: any; // 数量下限, 最小数量
  stepSize: any; // 订单最小数量间隔 / 允许的步进值
  limit: any;
  notional: any;
  multiplierUp: any; // 价格上限百分比
  multiplierDown: any; // 价格下限百分比
  multiplierDecimal: any;
}

/**
 * 
 * {
 * "exchangeFilters": [],
    "rateLimits": [ // API访问的限制
        {
            "interval": "MINUTE", // 按照分钟计算
            "intervalNum": 1, // 按照1分钟计算
            "limit": 2400, // 上限次数
            "rateLimitType": "REQUEST_WEIGHT" // 按照访问权重来计算
        },
        {
            "interval": "MINUTE",
            "intervalNum": 1,
            "limit": 1200,
            "rateLimitType": "ORDERS" // 按照订单数量来计算
        }
    ],
    "serverTime": 1565613908500, // 请忽略。如果需要获取当前系统时间，请查询接口 “GET /fapi/v1/time”
    "assets": [ // 资产信息
        {
            "asset": "BUSD",
            "marginAvailable": true, // 是否可用作保证金
            "autoAssetExchange": 0 // 保证金资产自动兑换阈值
        },
        {
            "asset": "USDT",
            "marginAvailable": true, // 是否可用作保证金
            "autoAssetExchange": 0 // 保证金资产自动兑换阈值
        },
        {
            "asset": "BNB",
            "marginAvailable": false, // 是否可用作保证金
            "autoAssetExchange": null // 保证金资产自动兑换阈值
        }
    ],
    "timezone": "UTC" // 服务器所用的时间区域
 * }
 * 
*/

export interface BinanceExchangeInfoResponse {
  exchangeFilters: any[];
  rateLimits: any[];
  serverTime: number; // 请忽略。如果需要获取当前系统时间，请查询接口 “GET /fapi/v1/time”
  assets: any[];
  symbols: BinanceSymbolInfo[];
  timezone: string;
}

export interface BinanceKlineApiOpts {
  symbol: string;
  interval: string; // 1m 3m 5m ...
  startTime?: number; // LONG
  endTime?: number; // LONG
  limit?: number; // 默认值:500 最大值:1500.
}

export interface BinanceWsMsg {
  [key: string]: string | number | boolean;
}

export interface BinanceTicker {
  symbol: string;
  priceChange: any; //24小时价格变动
  priceChangePercent: any; //24小时价格变动百分比
  weightedAvgPrice: any; //加权平均价
  lastPrice: any; //最近一次成交价
  lastQty: any; //最近一次成交额
  openPrice: any; //24小时内第一次成交的价格
  highPrice: any; //24小时最高价
  lowPrice: any; //24小时最低价
  volume: any; //24小时成交量
  quoteVolume: any; //24小时成交额
  openTime: number; //24小时内，第一笔交易的发生时间
  closeTime: number; //24小时内，最后一笔交易的发生时间
  firstId: number; // 首笔成交id
  lastId: number; // 末笔成交id
  count: number; // 成交笔数
}

// Binance Interval:
// 1m 3m 5m 15m 30m
// 1h 2h 4h 6h 8h 12h
// 1d 3d
export enum BinanceKlineInterval {
  candle1w = 10080,
  candle1d = 1440,
  candle12h = 720,
  candle6h = 360,
  candle4h = 240,
  candle2h = 120,
  candle1h = 60,
  candle30m = 30,
  candle15m = 15,
  candle5m = 5,
}
