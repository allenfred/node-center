import * as moment from 'moment';
import PublicClient from '../../lib/okex/publicClient';
import { V3WebsocketClient as OkxWsClient } from '@okfe/okex-node';
import { OKEX_WS_HOST, OKEX_HTTP_HOST } from '../../config';
import logger from '../../logger';
import { Exchange, OkxWsMsg, Instrument, OkxKlineChannel, OkxInst, KlineReqOpts, OkxKline } from '../../types';
import { handleMsg } from './handler';
import { InstrumentInfoDao } from '../../dao';

const pClient = PublicClient(OKEX_HTTP_HOST, 10000);

const KlineInterval = {
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

async function getOkxSwapInsts(): Promise<Array<Instrument>> {
  const data: { code: string; data: Array<OkxInst> } = await pClient.swap().getInstruments();
  if (+data.code === 0) {
    return data.data
      .filter((i) => i.state === 'live')
      .map((i) => {
        return {
          instrument_id: i.instId, // 合约ID，如BTC-USD-190322
          underlying_index: i.ctValCcy, // 交易货币币种，如：BTC-USD-190322中的BTC
          quote_currency: i.settleCcy, // 计价货币币种，如：BTC-USD-190322中的USD
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
async function getOkxKlines({ instrumentId, start, end, granularity }: KlineReqOpts): Promise<Array<OkxKline>> {
  try {
    const data = await pClient.getCandles({ instId: instrumentId, before: new Date(start).valueOf(), after: new Date(end).valueOf(), bar: KlineInterval[+granularity] });
    if (+data.code === 0) {
      logger.info(
        `获取 ${instrumentId}/${KlineInterval[+granularity]} K线成功: 从${moment(start).format('YYYY-MM-DD HH:mm:ss')}至${moment(end).format('YYYY-MM-DD HH:mm:ss')}, 共 ${data.data.length} 条`
      );
      return data.data;
    } else {
      logger.error(`获取 ${instrumentId}/${KlineInterval[+granularity]} K线失败: ${data.msg}`);
      return [];
    }
  } catch (e) {
    logger.error(`获取 ${instrumentId}/${KlineInterval[+granularity]} Catch Error: ${e}`);
    return [];
  }
}

function getSwapSubArgs(instruments: Instrument[]): Array<string> {
  return getBasicArgs(instruments);
}

function getBasicArgs(instruments: Instrument[]): Array<string> {
  const klineArgs = [];

  instruments.map((i: Instrument | SimpleIntrument) => {
    // 公共-K线频道
    ['candle5m', 'candle15m', 'candle30m', 'candle1H', 'candle2H', 'candle4H', 'candle6H', 'candle12H', 'candle1D', 'candle1W'].map((candleChannel) => {
      if (candleChannel === 'candle5m') {
        if (i.instrument_id.indexOf('BTC') > -1) {
          klineArgs.push({ channel: candleChannel, instId: i.instrument_id });
        }
      } else {
        klineArgs.push({ channel: candleChannel, instId: i.instrument_id });
      }
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

function broadCastMessage(msg: OkxWsMsg, clients: any[]) {
  if (!clients.length) {
    return;
  }

  function getChannelIndex(arg: any) {
    return `candle${OkxKlineChannel[arg.channel]}:${arg.instId}`;
  }

  clients.map((client: any) => {
    if (client.channels.includes(getChannelIndex(msg.arg))) {
      client.send(JSON.stringify({ channel: getChannelIndex(msg.arg), data: msg.data }));
    }
  });
}

async function setupOkexWsClient(clients: any[]) {
  const wsClient = new OkxWsClient(OKEX_WS_HOST);
  wsClient.connect();

  wsClient.on('open', async () => {
    logger.info('!!! 与Okx wsserver建立连接成功 !!!');
    // wsClient.login(apikey, secret, passphrase);

    const instruments: Instrument[] = await InstrumentInfoDao.find({ exchange: Exchange.Okex });

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
        handleMsg(obj);
        broadCastMessage(obj, clients);
      }
    } catch (e) {
      logger.error('handleMessage catch err: ', e);
    }
  });
}

export { setupOkexWsClient, getOkxSwapInsts, getOkxKlines };
