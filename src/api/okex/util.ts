import {
  Exchange,
  OkxWsMsg,
  KlineInterval,
  InstKline,
  OkxWsKline,
} from '../../types';
import { InstrumentInfoDao, InstrumentKlineDao } from '../../dao';

export function isKlineMsg(message: any) {
  if (message && message.arg && message.arg.channel.includes('candle')) {
    return true;
  }
  return false;
}

export function isTickerMsg(message: any) {
  if (message && message.arg && message.arg.channel === 'tickers') {
    return true;
  }
  return false;
}

export function getKlineSubChannel(arg: { channel: string; instId: string }) {
  return `okex.${KlineInterval[arg.channel.toLowerCase()]}.${arg.instId}`;
}

export function isApiServer(req: any) {
  try {
    return req && req.socket.remoteAddress == '121.4.15.211';
  } catch (e) {
    return false;
  }
}

export async function handleTickers(message: OkxWsMsg) {
  await InstrumentInfoDao.upsert(
    message.data
      .filter((i) => i.instId.indexOf('USDT') !== -1)
      .map((i) => {
        return {
          instrument_id: i.instId,
          last: i.last, // 最新成交价格
          chg_24h: i.last - i.open24h, // 24小时价格变化
          chg_rate_24h: (((i.last - i.open24h) * 100) / i.open24h).toFixed(4), // 24小时价格变化(百分比)
          high_24h: i.high24h, // 24小时最高价
          low_24h: i.low24h, // 24小时最低价
          volume_24h: i.vol24h, // 24小时成交量（按张数统计）
          timestamp: i.ts, // 系统时间 ISO_8601
          open_interest: '0', // 持仓量
          open_24h: i.open24h, // 24小时开盘价
          volume_token_24h: i.volCcy24h, // 	成交量（按币统计）
          exchange: Exchange.Okex,
        } as any;
      }),
  );
}

export async function handleKlines(message: OkxWsMsg) {
  const granularity = KlineInterval[message.arg.channel.toLowerCase()];
  const instrumentId = message.arg.instId;

  const klines: InstKline[] = message.data.map((kline: OkxWsKline) => {
    return {
      instrument_id: instrumentId,
      underlying_index: instrumentId.split('-')[0],
      quote_currency: instrumentId.split('-')[1],
      timestamp: new Date(+kline[0]),
      open: +kline[1],
      high: +kline[2],
      low: +kline[3],
      close: +kline[4],
      volume: +kline[5],
      currency_volume: +kline[6],
      granularity: +granularity,
      exchange: Exchange.Okex,
    };
  });

  await InstrumentKlineDao.upsertOne(klines[0]);
}

export async function handleMsg(message: OkxWsMsg) {
  // 每15min更新一次Ticker
  // if (
  //   isTickerMsg(message) &&
  //   new Date().getMinutes() % 10 === 0 &&
  //   new Date().getSeconds() < 30
  // ) {
  //   handleTickers(message);
  // }

  //  每30秒 更新K线数据
  if (new Date().getSeconds() % 30 === 0 && isKlineMsg(message)) {
    handleKlines(message);
  }
}
