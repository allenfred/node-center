import PublicClient from '../../lib/okex/publicClient';
import { V3WebsocketClient as OkxWsClient } from '@okfe/okex-node';
import { OKEX_WS_HOST, OKEX_HTTP_HOST } from '../../config';
import logger from '../../logger';
import {
  Exchange,
  OkxWsMsg,
  OkxWsTicker,
  Instrument,
  WsFormatKline,
} from '../../types';
import { InstrumentInfoDao } from '../../dao';
import { isKlineMsg, isTickerMsg, handleMsg, getKlineSubChannel } from './util';

const API_KEY = '753285f2-3afb-402e-a468-9783c9ef7e5d';
const PRIVATE_KEY = '4E5CC0FBF38D85827A520D5446F911A7';
const pass_phrase = 'Qazwsx123=-';

const pClient = PublicClient(OKEX_HTTP_HOST, 10000);
const client = pClient.swap();

const globalAny: any = global;

const OkxIntervalBar = {
  300: '5m',
  900: '15m',
  1800: '30m',
  3600: '1H',
  7200: '2H',
  14400: '4H',
  21600: '6H',
  43200: '12H',
  86400: '1D',
  604800: '1W',
};

function getSwapSubArgs(instruments: Instrument[]): Array<string> {
  return getBasicArgs(instruments);
}

function getBasicArgs(instruments: Instrument[]): Array<string> {
  const klineArgs = [];

  instruments.map((i: any) => {
    // 公共-K线频道
    // const subChannels = ['candle15m', 'candle1H', 'candle4H'];
    const subChannels = ['candle15m', 'candle1H'];

    subChannels.map((candleChannel) => {
      klineArgs.push({ channel: candleChannel, instId: i.instrument_id });
    });
  });

  // 公共-行情频道
  const tickerArgs = instruments.map((i: Instrument) => {
    return { channel: 'tickers', instId: i.instrument_id };
  });

  return klineArgs.concat(tickerArgs);
}

/* V5 API payload:
{
  "arg": {
    "channel": "candle1D",
    "instId": "BTC-USDT-SWAP"
  },
  "data": [
    [
      "1629993600000",
      "42500",
      "48199.9",
      "41006.1",
      "41006.1",
      "3587.41204591",
      "166741046.22583129"
    ]
  ]
} 
*/
export async function broadCastKline(msg: OkxWsMsg) {
  if (msg.arg.channel.includes('candle')) {
    const channel = getKlineSubChannel(msg.arg);
    const pubMsg = JSON.stringify({
      channel,
      data: msg.data[0] as WsFormatKline,
    });

    globalAny.io.to('klines').emit(channel, pubMsg);
  }
}

export async function broadCastTicker(msg: OkxWsMsg) {
  if (msg.arg.channel === 'tickers') {
    const pubMsg = JSON.stringify({
      channel: 'tickers',
      data: msg.data.map((i) => {
        // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
        return [
          Exchange.Okex,
          i.instId,
          i.last,
          i.last - i.open24h,
          (((i.last - i.open24h) * 100) / i.open24h).toFixed(4),
          i.vol24h,
        ];
      }),
    });

    globalAny.io.to('tickers').emit('tickers', pubMsg);
  }
}

async function setupWsClient() {
  const wsClient = new OkxWsClient(OKEX_WS_HOST);
  wsClient.connect();

  wsClient.on('open', async () => {
    globalAny.okexWsConnected = true;
    logger.info('!!! 与Okx wsserver建立连接成功 !!!');
    // wsClient.login(apikey, secret, passphrase);

    // const instruments: Instrument[] = await InstrumentInfoDao.find({
    //   exchange: Exchange.Okex,
    // });

    // 订阅永续频道信息
    // wsClient.subscribe(...getSwapSubArgs(instruments));
  });

  wsClient.on('close', () => {
    logger.error('!!! 与Okx wsserver断开连接 !!!');
    wsClient.connect();
  });

  wsClient.on('message', (data: any) => {
    try {
      // logger.info(`!!! ws message =${data}`);
      const msg: OkxWsMsg = JSON.parse(data);
      const eventType = msg.event;
      // if (eventType == 'login') {
      //   //登录消息
      //   if (obj?.success == true) {
      //     event.emit('login');
      //   }

      //   return;
      // }

      // 公共频道消息
      if (eventType == undefined) {
        // broadCastByWS(obj, clients);
        if (isKlineMsg(msg)) {
          broadCastKline(msg);
        }

        if (isTickerMsg(msg)) {
          broadCastTicker(msg);
        }
        // handleMsg(msg);
      }
    } catch (e) {
      logger.error('handleMessage catch err: ', e);
    }
  });

  return wsClient;
}

export { setupWsClient };
