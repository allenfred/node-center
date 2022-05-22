import * as moment from 'moment';
import PublicClient from '../../lib/okex/publicClient';
import { V3WebsocketClient as OkxWsClient } from '@okfe/okex-node';
import { OKEX_WS_HOST, OKEX_HTTP_HOST } from '../../config';
import logger from '../../logger';
import {
  Exchange,
  OkxWsMsg,
  Instrument,
  KlineInterval,
  OkxInst,
  KlineReqOpts,
  OkxKline,
  InstKline,
  OkxWsKline,
  WsFormatKline,
} from '../../types';
import {
  InstrumentInfoDao,
  InstrumentTickerDao,
  InstrumentKlineDao,
} from '../../dao';

const pClient = PublicClient(OKEX_HTTP_HOST, 10000);

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

interface SimpleIntrument {
  instrument_id: string;
}

async function getSwapInsts(): Promise<Array<Instrument>> {
  const data: { code: string; data: Array<OkxInst> } = await pClient
    .swap()
    .getInstruments();
  if (+data.code === 0) {
    return data.data
      .filter((i) => i.state === 'live')
      .map((i) => {
        return {
          instrument_id: i.instId, // 合约ID，如BTC-USDT-SWAP
          underlying_index: i.ctValCcy, // 交易货币币种，如：BTC-USDT-SWAP中的BTC
          quote_currency: i.settleCcy, // 计价货币币种，如：BTC-USDT-SWAP中的USDT
          tick_size: i.tickSz, // 下单价格精度 0.01
          contract_val: i.ctVal, // 合约面值 100
          listing: i.listTime, // 创建时间 '2019-09-06'
          delivery: i.expTime, // 结算时间 '2019-09-20'
          trade_increment: i.lotSz, // futures 下单数量精度
          size_increment: i.lotSz, // swap 下单数量精度
          alias: i.alias, // 本周 this_week 次周 next_week 季度 quarter 永续 swap
          settlement_currency: i.settleCcy, // 盈亏结算和保证金币种，BTC
          contract_val_currency: i.ctValCcy, // 合约面值计价币种
          exchange: Exchange.Okex,
        };
      });
  } else {
    return [];
  }
}

// V5 获取合约K线数据
async function getKlines({
  instrumentId,
  start,
  end,
  granularity,
}: KlineReqOpts): Promise<Array<OkxKline>> {
  return pClient
    .getCandles({
      instId: instrumentId,
      before: new Date(start).valueOf(),
      after: new Date(end).valueOf(),
      bar: OkxIntervalBar[+granularity],
      limit: 300,
    })
    .then((res) => {
      // logger.info(
      //   `获取 [Okx/${instrumentId}/${
      //     KlineInterval[+granularity]
      //   }] K线: ${moment(start).format('YYYY-MM-DD HH:mm:ss')}至${moment(
      //     end,
      //   ).format('MM-DD HH:mm:ss')}, ${res.data.length} 条`,
      // );
      return res.data;
    })
    .catch((e) => {
      logger.error(
        `获取 [Okx/${instrumentId}/${KlineInterval[+granularity]}]: ${e}`,
      );
      return [];
    });
}

function getSwapSubArgs(instruments: Instrument[]): Array<string> {
  return getBasicArgs(instruments);
}

function getBasicArgs(instruments: Instrument[]): Array<string> {
  const klineArgs = [];

  instruments.map((i: Instrument | SimpleIntrument) => {
    // 公共-K线频道
    // const subChannels = ['candle15m', 'candle1H', 'candle4H'];
    const subChannels = ['candle1H', 'candle4H'];

    subChannels.map((candleChannel) => {
      klineArgs.push({ channel: candleChannel, instId: i.instrument_id });
    });
  });

  // 公共-行情频道
  const tickerArgs = instruments.map((i: Instrument) => {
    return { channel: 'tickers', instId: i.instrument_id };
  });

  // 公共-持仓总量频道
  const openInterstArgs = instruments.map((i: Instrument) => {
    return { channel: 'open-interest', instId: i.instrument_id };
  });

  // 公共-交易频道
  const tradeArgs = instruments.map((i: Instrument) => {
    return { channel: 'trades', instId: i.instrument_id };
  });

  // 公共-资金费率频道
  const fundingRateArgs = instruments.map((i: Instrument) => {
    return { channel: 'funding-rate', instId: i.instrument_id };
  });

  return klineArgs.concat(tickerArgs);
}

/* V5 API 
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

export async function handleTickers(message: OkxWsMsg) {
  await InstrumentTickerDao.upsert(
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
        };
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

function isKlineMsg(message: any) {
  if (message && message.arg && message.arg.channel.indexOf('candle') !== -1) {
    return true;
  }
  return false;
}

function isTickerMsg(message: any) {
  if (message && message.arg && message.arg.channel === 'tickers') {
    return true;
  }
  return false;
}

export async function handleMsg(message: OkxWsMsg, clients?: any[]) {
  broadCastMsg(message, clients);

  // 每15min更新一次Ticker
  if (
    isTickerMsg(message) &&
    new Date().getMinutes() % 15 === 0 &&
    new Date().getSeconds() < 10
  ) {
    handleTickers(message);
  }

  //  每10秒更新K线数据
  if (new Date().getSeconds() % 10 === 0 && isKlineMsg(message)) {
    handleKlines(message);
  }
}

export async function broadCastMsg(msg: OkxWsMsg, clients: any[]) {
  if (!clients.length) {
    return;
  }

  function getChannelIndex(arg: any) {
    return `okex:candle${KlineInterval[arg.channel.toLowerCase()]}:${
      arg.instId
    }`;
  }

  clients.map((client: any) => {
    if (
      new Date().getSeconds() % 2 === 0 &&
      msg.arg.channel === 'tickers' &&
      client.channels.includes('tickers')
    ) {
      client.send(
        JSON.stringify({
          channel: 'tickers',
          data: msg.data
            // .filter((i) => i.instId.indexOf('USDT') !== -1)
            .map((i) => {
              return {
                instrument_id: i.instId,
                last: i.last, // 最新成交价格
                chg_24h: i.last - i.open24h, // 24小时价格变化
                chg_rate_24h: (
                  ((i.last - i.open24h) * 100) /
                  i.open24h
                ).toFixed(4), // 24小时价格变化(百分比)
                volume_24h: i.vol24h, // 24小时成交量（按张数统计）
                exchange: Exchange.Okex,
              };
            }),
        }),
      );
    }

    if (
      msg.arg.channel.includes('candle') &&
      client.channels.includes(getChannelIndex(msg.arg))
    ) {
      client.send(
        JSON.stringify({
          channel: getChannelIndex(msg.arg),
          data: msg.data[0] as WsFormatKline,
        }),
      );
    }
  });
}

async function setupWsClient(clients: any[]) {
  const wsClient = new OkxWsClient(OKEX_WS_HOST);
  wsClient.connect();

  wsClient.on('open', async () => {
    logger.info('!!! 与Okx wsserver建立连接成功 !!!');
    // wsClient.login(apikey, secret, passphrase);

    const instruments: Instrument[] = await InstrumentInfoDao.find({
      exchange: Exchange.Okex,
    });

    // 订阅永续频道信息
    wsClient.subscribe(...getSwapSubArgs(instruments));
  });

  wsClient.on('close', () => {
    logger.error('!!! 与Okx wsserver断开连接 !!!');
    wsClient.connect();
  });

  wsClient.on('message', (data: any) => {
    try {
      // logger.info(`!!! ws message =${data}`);
      var obj: OkxWsMsg = JSON.parse(data);
      var eventType = obj.event;

      // if (eventType == 'login') {
      //   //登录消息
      //   if (obj?.success == true) {
      //     event.emit('login');
      //   }

      //   return;
      // }

      // 公共频道消息
      if (eventType == undefined) {
        handleMsg(obj, clients);
      }
    } catch (e) {
      logger.error('handleMessage catch err: ', e);
    }
  });
}

export { setupWsClient, getSwapInsts, getKlines };
