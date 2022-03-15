import { InstrumentKlineDao, InstrumentTickerDao } from '../../dao';
import { Exchange, InstKline, BianceWsMsg, BianceKlineChannel } from '../../types';

interface MiniTicker {
  e: string; // 事件类型 24hrMiniTicker
  E: number; // 事件时间(毫秒) 123456789
  s: string; // 交易对  BTCUSDT
  c: string; // 最新成交价格
  o: string; // 24小时前开始第一笔成交价格
  h: string; // 24小时内最高成交价
  l: string; // 24小时内最低成交价
  v: string; // 成交量
  q: string; // 成交额
}

interface Ticker {
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

export async function handleTickers(message: BianceWsMsg) {
  await InstrumentTickerDao.upsert(
    message.data
      .filter((i) => i.s.indexOf('USDT') !== -1)
      .map((i: Ticker) => {
        return {
          instrument_id: i.s, // symbol
          last: i.c, // 最新成交价格
          chg_24h: i.p, // 24小时价格变化
          chg_rate_24h: i.P, // 24小时价格变化(百分比)
          high_24h: i.h, // 24小时最高价
          low_24h: i.l, // 24小时最低价
          volume_24h: i.q, // 24小时成交量（按张数统计）
          timestamp: i.E, // 系统时间 ISO_8601
          open_interest: '', // 持仓量
          open_24h: i.o, // 24小时开盘价
          volume_token_24h: i.v, // 	成交量（按币统计）
          exchange: Exchange.Biance,
        };
      })
  );
}

function isTickerMsg(message: BianceWsMsg) {
  if (message && message.stream === '!ticker@arr') {
    return true;
  }
  return false;
}

export async function handleMsg(message: BianceWsMsg) {
  if (!(new Date().getSeconds() % 10 === 0)) {
    return;
  }

  if (isTickerMsg(message)) {
    handleTickers(message);
  }
}

export async function broadCastMsg(msg: BianceWsMsg, clients: any[]) {
  if (!clients.length) {
    return;
  }

  function getChannelIndex(arg: any) {
    return `biance:candle${BianceKlineChannel[arg.channel]}:${arg.instId}`;
  }

  clients.map((client: any) => {
    if (msg.stream === '!ticker@arr' && client.channels.includes('tickers')) {
      client.send(
        JSON.stringify({
          channel: 'tickers',
          data: msg.data
            .filter((i) => i.s.indexOf('USDT') !== -1)
            .map((i: Ticker) => {
              return {
                instrument_id: i.s, // symbol
                last: i.c, // 最新成交价格
                chg_24h: i.p, // 24小时价格变化
                chg_rate_24h: i.P, // 24小时价格变化(百分比)
                volume_24h: i.q, // 24小时成交量（按张数统计）
                exchange: Exchange.Biance,
              };
            }),
        })
      );
    }

    // if (msg.stream === '!ticker@arr' && client.channels.includes(getChannelIndex(msg.arg))) {
    //   client.send(JSON.stringify({ channel: getChannelIndex(msg.arg), data: msg.data }));
    // }
  });
}
