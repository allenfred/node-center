export interface BybitKline {
  id: number;
  symbol: string;
  period: string;
  start_at: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
  interval: number; // 數據記錄周期. 5min 15min 30min 1h 4h 1d
  open_time: number;
  turnover: number;
}

// kline payload:
/**
    {
      topic: 'candle.240.BTCUSDT',
      data: [
        {
          start: 1657324800,
          end: 1657339200,
          period: '240',
          open: 21590,
          close: 21439,
          high: 21688.5,
          low: 21400,
          volume: '14423.617',
          turnover: '310796217.4615',
          confirm: False,
          cross_seq: 13772456642,
          timestamp: 1657330433544253,
        },
      ],
      timestamp_e6: 1657330433544253,
    }
   * 
  */
export interface BybitWsKlineMsg {
  topic: string;
  data: BybitWsKline[];
  timestamp_e6: number;
}

export interface BybitWsKline {
  start: number; // 开始时间 秒
  end: number; // 结束时间 秒
  open: number;
  close: number;
  high: number;
  low: number;
  volume: string; // 成交量
  turnover: string; // 成交金额
  confirm: boolean; // if true 当前K线 最后一个tick
  cross_seq: number; // 撮合版本号
  timestamp: number; // 结束时间戳
}

// {
//     "symbol": "BTCUSD",
//     "bid_price": "7230",
//     "ask_price": "7230.5",
//     "last_price": "7230.00",
//     "last_tick_direction": "ZeroMinusTick",
//     "prev_price_24h": "7163.00",
//     "price_24h_pcnt": "0.009353",
//     "high_price_24h": "7267.50",
//     "low_price_24h": "7067.00",
//     "prev_price_1h": "7209.50",
//     "price_1h_pcnt": "0.002843",
//     "mark_price": "7230.31",
//     "index_price": "7230.14",
//     "open_interest": 117860186,
//     "open_value": "16157.26",
//     "total_turnover": "3412874.21",
//     "turnover_24h": "10864.63",
//     "total_volume": 28291403954,
//     "volume_24h": 78053288,
//     "funding_rate": "0.0001",
//     "predicted_funding_rate": "0.0001",
//     "next_funding_time": "2019-12-28T00:00:00Z",
//     "countdown_hour": 2,
//     "delivery_fee_rate": "0",
//     "predicted_delivery_price": "0.00",
//     "delivery_time": ""
// }
export interface BybitTicker {
  symbol: string;
  bid_price: string;
  ask_price: string;
  last_price: string;
  last_tick_direction: string;
  prev_price_24h: string;
  price_24h_pcnt: string;
  high_price_24h: string;
  low_price_24h: string;
  prev_price_1h: string;
  price_1h_pcnt: string;
  mark_price: string;
  index_price: string;
  open_interest: number;
  open_value: string;
  total_turnover: string;
  turnover_24h: string;
  total_volume: number;
  volume_24h: number;
  funding_rate: string;
  predicted_funding_rate: string;
  next_funding_time: string;
  countdown_hour: number;
  delivery_fee_rate: string;
  predicted_delivery_price: string;
  delivery_time: string;
}

export interface BybitWsTicker {
  id: number;
  symbol: string;
  bid_price: string;
  ask_price: string;
  last_price: string;
  last_price_e4: string;
  last_tick_direction: string;
  prev_price_24h: string;
  prev_price_24h_e4: string;
  price_24h_pcnt_e6: string;
  price_24h_pcnt: string;
  high_price_24h: string;
  low_price_24h: string;
  prev_price_1h: string;
  price_1h_pcnt: string;
  mark_price: string;
  index_price: string;
  open_interest: number;
  open_value: string;
  total_turnover: string;
  turnover_24h: string;
  total_volume: number;
  volume_24h: number;
  funding_rate: string;
  predicted_funding_rate: string;
  next_funding_time: string;
  countdown_hour: number;
  delivery_fee_rate: string;
  predicted_delivery_price: string;
  delivery_time: string;
  high_price_24h_e4: string;
  low_price_24h_e4: string;
  prev_price_1h_e4: string;
  price_1h_pcnt_e6: string;
  mark_price_e4: string;
  index_price_e4: string;
  open_interest_e8: string;
  total_turnover_e8: string;
  turnover_24h_e8: string;
  total_volume_e8: string;
  volume_24h_e8: string;
  funding_rate_e6: string;
  predicted_funding_rate_e6: string;
  cross_seq: string;
  created_at: string;
  updated_at: string;
  count_down_hour: number;
  funding_rate_interval: number;
  bid1_price_e4: string;
  ask1_price_e4: string;
  bid1_price: string;
  ask1_price: string;
}

export interface BybitWsTickerMsg {
  topic: string;
  type: string;
  data: BybitWsTicker | { update: BybitWsTicker[] };
  cross_seq: string;
  timestamp_e6: string;
}

export interface BybitKlineApiOpts {
  symbol: string;
  interval: string; // 1m 3m 5m ...
  startTime?: number; // LONG
  endTime?: number; // LONG
  limit?: number; // 默认值:500 最大值:1500.
}

export interface BybitWsMsg {
  topic: string; // candle.15.BTCUSDT
  data: any[];
}

export enum BybitWsTickerMsgType {
  snapshot = 'snapshot',
  delta = 'delta',
}
