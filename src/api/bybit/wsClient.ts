const { LinearClient } = require('bybit-api');
import { WebsocketClient } from 'bybit-api';
import {
  Instrument,
  Exchange,
  WsFormatKline,
  BybitWsKlineMsg,
  BybitWsTickerMsg,
  BybitWsTickerMsgType,
} from '../../types';
import logger from '../../logger';
import { InstrumentInfoDao } from '../../dao';
import {
  isKlineMsg,
  isTickerMsg,
  handleKlines,
  getFormattedKlineSubChannel,
} from './util';
import { BybitWsMsg, BybitWsTicker } from '../../types/bybit';

const API_KEY = 'iS12CdTOC1SmCs5kQ0';
const PRIVATE_KEY = 'Vz2L9UokimS6bz5ePwTHzWhcUXkd1qlul3MI';
const useLivenet = true;

const globalAny: any = global;

const client = new LinearClient(
  API_KEY,
  PRIVATE_KEY,
  // optional, uses testnet by default. Set to 'true' to use livenet.
  useLivenet,
  // restClientOptions,
  // requestLibraryOptions
);

const SNAPSHOT = {};

async function broadCastTickers(msg: BybitWsTickerMsg) {
  let data: any;

  // 連接建立成功後首次推送
  if (msg.type === BybitWsTickerMsgType.snapshot) {
    const ticker = msg.data as BybitWsTicker;
    // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
    data = [
      Exchange.Bybit,
      ticker.symbol,
      +ticker.last_price,
      +ticker.last_price - +ticker.prev_price_24h,
      +ticker.price_24h_pcnt_e6 / Math.pow(10, 6),
      +ticker.turnover_24h_e8 / Math.pow(10, 8),
    ];

    SNAPSHOT[ticker.symbol] = data;
  }

  // 快照數據推送後，推送的增量數據
  if (msg.type === BybitWsTickerMsgType.delta) {
    const {
      update: [ticker],
    } = msg.data as { update: BybitWsTicker[] };
    // console.log(ticker);
    // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
    data = [
      Exchange.Bybit,
      ticker.symbol,
      +ticker.last_price || SNAPSHOT[ticker.symbol][2],
      +ticker.last_price - +ticker.prev_price_24h || SNAPSHOT[ticker.symbol][3],
      +ticker.price_24h_pcnt_e6 / Math.pow(10, 6) || SNAPSHOT[ticker.symbol][4],
      +ticker.turnover_24h_e8 / Math.pow(10, 8) || SNAPSHOT[ticker.symbol][5],
    ];
  }

  const pubMsg = JSON.stringify({
    channel: 'tickers',
    data: [data],
  });

  globalAny.io.to('tickers').emit('tickers', pubMsg);
}

async function broadCastKlines(msg: BybitWsKlineMsg) {
  const channel = getFormattedKlineSubChannel(msg);
  const pubMsg = JSON.stringify({
    channel,
    data: [
      msg.data[0].start * 1000 + '',
      msg.data[0].open + '',
      msg.data[0].high + '',
      msg.data[0].low + '',
      msg.data[0].close + '',
      msg.data[0].volume,
      msg.data[0].turnover,
    ] as WsFormatKline,
  });

  globalAny.io.to('klines').emit(channel, pubMsg);
}

async function setupWsClient() {
  // const intervals = ['15m', '1h', '4h'];
  const intervals = ['15', '60'];

  // support combined stream, e.g.
  const instruments: Instrument[] = await InstrumentInfoDao.findByTopVolume({
    exchange: Exchange.Bybit,
    limit: 20,
  });
  const klineStreams: string[] = [];
  instruments
    .filter((i) => {
      return i.instrument_id.endsWith('USDT');
    })
    .forEach((e) => {
      intervals.forEach((i) => {
        klineStreams.push(`candle.${i}.${e.instrument_id}`);
      });
    });

  const wsClient = new WebsocketClient(
    {
      key: API_KEY,
      secret: PRIVATE_KEY,
      market: 'linear',
      linear: true,
      livenet: true,
    },
    logger,
  );

  wsClient.connectPublic();

  wsClient.on('update', (data: any) => {
    if (isKlineMsg(data)) {
      broadCastKlines(data);
    }

    if (isTickerMsg(data)) {
      broadCastTickers(data);
    }
  });

  wsClient.on('open', (data) => {
    globalAny.bybitWsConnected = true;
    logger.info('[Bybit] ws open:' + data.wsKey);
    // wsClient.subscribe(klineStreams);
  });

  wsClient.on('response', (data) => {
    logger.info('[Bybit] ws response: ' + JSON.stringify(data));
  });

  wsClient.on('reconnect', ({ wsKey }) => {
    logger.info('[Bybit] ws automatically reconnecting.... ' + wsKey);
  });

  wsClient.on('reconnected', (data) => {
    logger.info('[Bybit] ws has reconnected ' + data?.wsKey);
  });

  return wsClient;
}

export { setupWsClient };
