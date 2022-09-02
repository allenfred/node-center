import { KlineInterval, BinanceWsMsg } from '../../types';

export function isTickerMsg(message: BinanceWsMsg) {
  if (
    message &&
    (message.stream === '!ticker@arr' || message.stream === '!miniTicker@arr')
  ) {
    return true;
  }
  return false;
}

export function isKlineMsg(message: BinanceWsMsg) {
  if (message && message.stream.indexOf('@kline') !== -1) {
    return true;
  }
  return false;
}

export function isKlineFinish(message: BinanceWsMsg) {
  if (message.data.k.x) {
    return true;
  }
  return false;
}

export function getKlineSubChannel(interval: string, instId: string) {
  return `binance:candle${KlineInterval['candle' + interval]}:${instId}`;
}
