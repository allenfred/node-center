import { KlineInterval, BianceWsMsg } from '../../types';

export function isTickerMsg(message: BianceWsMsg) {
  if (
    message &&
    (message.stream === '!ticker@arr' || message.stream === '!miniTicker@arr')
  ) {
    return true;
  }
  return false;
}

export function isKlineMsg(message: BianceWsMsg) {
  if (message && message.stream.indexOf('@kline') !== -1) {
    return true;
  }
  return false;
}

export function isKlineFinish(message: BianceWsMsg) {
  if (message.data.k.x) {
    return true;
  }
  return false;
}

export function getKlineSubChannel(interval: string, instId: string) {
  return `biance:candle${KlineInterval['candle' + interval]}:${instId}`;
}
