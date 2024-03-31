const { Spot } = require('@binance/connector');
import {
  Exchange,
  WsFormatKline,
  BinanceWsKlineMsg,
  BinanceWsMiniTicker,
  BinanceWsTicker,
  Instrument,
} from '../../types';
import logger from '../../logger';
import { isKlineMsg, isTickerMsg, getKlineSubChannel, handleMsg } from './util';

// #TODO: handleMessage update to Redis
const globalAny: any = global;

const API_KEY =
  'MxUyyavVFOC2aWYZLtAG9hQkq9s4rpQAyvlND19gqqIG5iCyDJ15wtrLZhqbjBkT';
const SECRET_KEY =
  'I6eTFNu3YAFOiiWLm2XO27wFxkqjSfPls6OtRL83DZXaMbAkUlo6zSKpuSmC19pX';
const host = 'wss://fstream.binance.com';

const client = new Spot('', '', {
  baseURL: 'https://fapi.binance.com',
  wsURL: host, // If optional base URL is not provided, wsURL defaults to wss://stream.binance.com:9443
});

export async function broadCastKlines(msg: BinanceWsKlineMsg) {
  if (isKlineMsg(msg)) {
    const interval = msg.k.i; // 1h
    const instId = msg.s;
    const subChannel = getKlineSubChannel(interval, instId.toUpperCase());
    const k = msg.k;

    const pubMsg = JSON.stringify({
      channel: subChannel,
      data: [k.t, k.o, k.h, k.l, k.c, k.v, k.q] as WsFormatKline,
    });

    globalAny.io.to('klines').emit(subChannel, pubMsg);
  }
}

export async function broadCastTickers(msg: any) {
  let pubMsg: string;
  if (msg.length) {
    pubMsg = JSON.stringify({
      channel: 'tickers',
      data: msg
        .filter((i: BinanceWsTicker | BinanceWsMiniTicker) =>
          i.s.endsWith('USDT'),
        )
        .map((i: BinanceWsTicker | BinanceWsMiniTicker) => {
          // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
          return [
            Exchange.Binance,
            i.s, // symbol
            i.c, //  // 最新成交价格
            +i.c - +i.o, // 24小时价格变化
            (((+i.c - +i.o) * 100) / +i.o).toFixed(4), // 24小时价格变化(百分比)
            i.q, // // 24小时成交量（按张数统计）
          ];
        }),
    });
  } else {
    const i = msg;
    pubMsg = JSON.stringify({
      channel: 'tickers',
      data: [
        Exchange.Binance,
        i.s, // symbol
        i.c, //  // 最新成交价格
        +i.c - +i.o, // 24小时价格变化
        (((+i.c - +i.o) * 100) / +i.o).toFixed(4), // 24小时价格变化(百分比)
        i.q, // // 24小时成交量（按张数统计）
      ],
    });
  }

  globalAny.io.to('tickers').emit('tickers', pubMsg);
}

async function setupWsClient(instruments: Instrument[]) {
  const subStr = instruments.reduce((acc, { instrument_id }) => {
    const instId = instrument_id.toLowerCase();
    return [
      ...acc,
      `${instId}@kline_15m`,
      `${instId}@kline_1h`,
      `${instId}@kline_4h`,
      `${instId}@kline_1d`,
    ];
  }, []);
  const subUrl = `${host}/ws/!miniTicker@arr/${subStr.join('/')}`;

  const wsRef = client.subscribe(subUrl, {
    open: () => {
      logger.info('!!! 与Binance wsserver建立连接成功 !!!');
      globalAny.binanceWsConnected = true;
    },
    close: () => {
      logger.error('!!! 与Binance wsserver断开连接 !!!');
    },
    message: (data: string) => {
      const msg = JSON.parse(data);
      if (isKlineMsg(msg)) {
        broadCastKlines(msg);
      }

      if (isTickerMsg(data)) {
        broadCastTickers(msg);
      }

      handleMsg(JSON.parse(data));
    },
  });

  return wsRef.ws;
}

export { setupWsClient };
