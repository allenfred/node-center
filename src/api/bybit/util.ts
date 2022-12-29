import { InstrumentKlineDao, InstrumentInfoDao } from '../../dao';
import {
  Exchange,
  BybitWsKline,
  BybitWsKlineMsg,
  BybitWsMsg,
  KlineInterval,
} from '../../types';

export function isKlineMsg(msg: BybitWsMsg) {
  return msg.topic.includes('candle');
}

export function isTickerMsg(msg: BybitWsMsg) {
  return msg.topic.includes('instrument_info');
}

export async function handleKlines(msg: BybitWsMsg) {
  const splitStr = msg.topic.split('.');
  const symbol = splitStr[2];
  const k: BybitWsKline = msg.data[0];
  await InstrumentKlineDao.upsertOne({
    instrument_id: symbol,
    underlying_index: symbol.replace('USDT', ''),
    quote_currency: 'USDT',
    timestamp: k.start,
    open: +k.open,
    high: +k.high,
    low: +k.low,
    close: +k.close,
    volume: +k.volume, // 成交量
    currency_volume: +k.turnover, // 成交额 以USDT计价
    granularity: +splitStr[1] * 60,
    exchange: Exchange.Bybit,
  });
}

export function getFormattedKlineSubChannel({ topic }: BybitWsMsg) {
  if (topic.includes('candle')) {
    const strArr = topic.split('.');
    const interval =
      strArr[1] && +strArr[1] < 60
        ? strArr[1] + 'm'
        : Math.round(+strArr[1] / 60) + 'h';
    const instId = strArr[2];
    return `bybit.${KlineInterval['candle' + interval]}.${instId}`;
  }
}
