const { Spot } = require('@binance/connector');
import * as moment from 'moment';
import {
  Instrument,
  Exchange,
  BianceExchangeInfoResponse,
  BianceSymbolInfo,
  BianceKline,
  BianceKlineApiOpts,
  FilterType,
  BianceWsMsg,
  KlineInterval,
  WsFormatKline,
  BianceWsKline,
  BianceTicker,
} from '../../types';
import logger from '../../logger';
import { InstrumentKlineDao, InstrumentInfoDao } from '../../dao';
import redisClient from '../../redis/client';
import { isKlineMsg, isTickerMsg, getKlineSubChannel } from './util';
import { getInstrumentAlias } from '../../util';

let publisher = null;

const client = new Spot('', '', {
  baseURL: 'https://fapi.binance.com',
  wsURL: 'wss://fstream.binance.com', // If optional base URL is not provided, wsURL defaults to wss://stream.binance.com:9443
});

interface MiniTicker {
  e: string; // 事件类型 24hrMiniTicker
  E: string; // 事件时间(毫秒) 123456789
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
  await InstrumentInfoDao.upsert(
    message.data
      .filter((i) => i.s.endsWith('USDT') !== -1)
      .map((i: MiniTicker) => {
        return {
          instrument_id: i.s, // symbol
          last: i.c, // 最新成交价格
          // chg_24h: i.p, // 24小时价格变化
          chg_24h: +i.c - +i.o, // 24小时价格变化
          // chg_rate_24h: i.P, // 24小时价格变化(百分比)
          chg_rate_24h: (((+i.c - +i.o) * 100) / +i.o).toFixed(4), // 24小时价格变化(百分比)
          high_24h: i.h, // 24小时最高价
          low_24h: i.l, // 24小时最低价
          volume_24h: i.q, // 24小时成交量（按张数统计）
          timestamp: i.E, // 系统时间 ISO_8601
          open_interest: '', // 持仓量
          open_24h: i.o, // 24小时开盘价
          volume_token_24h: i.v, // 	成交量（按币统计）
          exchange: Exchange.Biance,
        } as any;
      }),
  );
}

export async function handleKlines(msg: BianceWsMsg) {
  const k: BianceWsKline = msg.data['k'];
  await InstrumentKlineDao.upsertOne({
    instrument_id: k.s,
    underlying_index: k.s.replace('USDT', ''),
    quote_currency: 'USDT',
    timestamp: k.t,
    open: +k.o,
    high: +k.h,
    low: +k.l,
    close: +k.c,
    volume: +k.v, // 成交量
    currency_volume: +k.q, // 成交额 以USDT计价
    granularity: KlineInterval['candle' + k.i],
    exchange: Exchange.Biance,
  });
}

export async function handleMsg(message: BianceWsMsg) {
  // 每15min更新一次Ticker
  if (
    isTickerMsg(message) &&
    new Date().getMinutes() % 15 === 0 &&
    new Date().getSeconds() < 30
  ) {
    handleTickers(message);
  }

  //  每30秒 更新K线数据
  if (new Date().getSeconds() % 20 === 0 && isKlineMsg(message)) {
    handleKlines(message);
  }
}

export async function broadCastByWS(msg: BianceWsMsg, clients: any[]) {
  if (!clients.length) {
    return;
  }

  clients.map((client: any) => {
    // ticker
    if (new Date().getSeconds() % 2 === 0 && isTickerMsg(msg)) {
      if (client.isApiServer || client.channels.includes('tickers')) {
        client.send(
          JSON.stringify({
            channel: 'tickers',
            data: msg.data
              .filter((i) => i.s.endsWith('USDT'))
              .map((i: Ticker) => {
                return [
                  Exchange.Biance,
                  i.s,
                  i.c,
                  +i.c - +i.o,
                  (((+i.c - +i.o) * 100) / +i.o).toFixed(4),
                  i.q,
                ];
              }),
          }),
        );
      }
    }

    // kline
    /**
     * {
        "e": "kline",     // 事件类型
        "E": 123456789,   // 事件时间
        "s": "BNBUSDT",    // 交易对
        "k": {
          "t": 123400000, // 这根K线的起始时间
          "T": 123460000, // 这根K线的结束时间
          "s": "BNBUSDT",  // 交易对
          "i": "1m",      // K线间隔
          "f": 100,       // 这根K线期间第一笔成交ID
          "L": 200,       // 这根K线期间末一笔成交ID
          "o": "0.0010",  // 开盘价
          "c": "0.0020",  // 收盘价
          "h": "0.0025",  // 最高价
          "l": "0.0015",  // 最低价
          "v": "1000",    // 这根K线期间成交量
          "n": 100,       // 这根K线期间成交笔数
          "x": false,     // 这根K线是否完结(是否已经开始下一根K线)
          "q": "1.0000",  // 这根K线期间成交额
          "V": "500",     // 主动买入的成交量
          "Q": "0.500",   // 主动买入的成交额
          "B": "123456"   // 忽略此参数
        }
      }
    */
    if (isKlineMsg(msg)) {
      const strs = msg.stream.split('_');
      const interval = strs[1]; // 1h
      const instId = msg.data['s'];
      const subChannel = getKlineSubChannel(interval, instId.toUpperCase());

      if (client.isApiServer || client.channels.includes(subChannel)) {
        const k = msg.data['k'];
        client.send(
          JSON.stringify({
            channel: subChannel,
            data: [k.t, k.o, k.h, k.l, k.c, k.v, k.q] as WsFormatKline,
          }),
        );
      }
    }
  });
}

export async function broadCastMsgByRedis(msg: BianceWsMsg) {
  if (msg.stream === '!ticker@arr' || msg.stream === '!miniTicker@arr') {
    const pubMsg = JSON.stringify({
      channel: 'tickers',
      data: msg.data
        .filter((i) => i.s.endsWith('USDT'))
        .map((i: Ticker) => {
          // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
          return [
            Exchange.Biance,
            i.s,
            i.c,
            +i.c - +i.o,
            (((+i.c - +i.o) * 100) / +i.o).toFixed(4),
            i.q,
          ];
          // return {
          //   instrument_id: i.s, // symbol
          //   last: i.c, // 最新成交价格
          //   chg_24h: +i.c - +i.o, // 24小时价格变化
          //   chg_rate_24h: (((+i.c - +i.o) * 100) / +i.o).toFixed(4), // 24小时价格变化(百分比)
          //   volume_24h: i.q, // 24小时成交量（按张数统计）
          //   exchange: Exchange.Biance,
          // };
        }),
    });

    publisher.publish('tickers', pubMsg);
  }

  // kline msg body
  /**
   * {
      "e": "kline",     // 事件类型
      "E": 123456789,   // 事件时间
      "s": "BNBUSDT",    // 交易对
      "k": {
        "t": 123400000, // 这根K线的起始时间
        "T": 123460000, // 这根K线的结束时间
        "s": "BNBUSDT",  // 交易对
        "i": "1m",      // K线间隔
        "f": 100,       // 这根K线期间第一笔成交ID
        "L": 200,       // 这根K线期间末一笔成交ID
        "o": "0.0010",  // 开盘价
        "c": "0.0020",  // 收盘价
        "h": "0.0025",  // 最高价
        "l": "0.0015",  // 最低价
        "v": "1000",    // 这根K线期间成交量
        "n": 100,       // 这根K线期间成交笔数
        "x": false,     // 这根K线是否完结(是否已经开始下一根K线)
        "q": "1.0000",  // 这根K线期间成交额
        "V": "500",     // 主动买入的成交量
        "Q": "0.500",   // 主动买入的成交额
        "B": "123456"   // 忽略此参数
      }
    }
  */
  if (msg.stream.indexOf('kline') > -1) {
    const strs = msg.stream.split('_');
    const interval = strs[1]; // 1h
    const instId = msg.data['s'];
    const subChannel = getKlineSubChannel(interval, instId.toUpperCase());
    const k = msg.data['k'];
    let pubMsg = JSON.stringify({
      channel: subChannel,
      data: [k.t, k.o, k.h, k.l, k.c, k.v, k.q] as WsFormatKline,
    });

    publisher.publish('klines', pubMsg);
  }
}

async function setupWsClient(clients: any[]) {
  // publisher = redisClient.duplicate();
  // await publisher.connect();

  // const intervals = ['15m', '1h', '4h'];
  const intervals = ['15m', '1h'];

  // support combined stream, e.g.
  const instruments: Instrument[] = await InstrumentInfoDao.findByTopVolume({
    exchange: Exchange.Biance,
    limit: 80,
  });
  const klineStreams = [];
  instruments
    .filter((i) => {
      return i.instrument_id.endsWith('USDT');
    })
    .forEach((e) => {
      intervals.forEach((i) => {
        klineStreams.push(
          e.instrument_id.replace('-', '').toLowerCase() + '@kline_' + i,
        );
      });
    });

  // stream名称中所有交易对均为小写
  // !miniTicker@arr 全市场的精简Ticker
  // !ticker@arr 全市场的完整Ticker
  const combinedStreams = client.combinedStreams(
    klineStreams.concat(['!miniTicker@arr']),
    // ['!miniTicker@arr'],
    {
      open: () => {
        logger.info('!!! 与Biance wsserver建立连接成功 !!!');
      },
      close: () => {
        logger.error('!!! 与Biance wsserver断开连接 !!!');
      },
      message: (data: any) => {
        // const jsonData = JSON.parse(data);
        // if (jsonData.stream !== '!ticker@arr') {
        // console.log(data);
        // }
        // broadCastByWS(JSON.parse(data), clients);
        handleMsg(JSON.parse(data));
      },
    },
  );
}

/* // API访问的限制
[
  {
    rateLimitType: 'REQUEST_WEIGHT',  // 按照访问权重来计算
    interval: 'MINUTE', // 按照分钟计算
    intervalNum: 1, // 按照1分钟计算
    limit: 2400  // 上限次数
  },
  {
    rateLimitType: 'ORDERS',
    interval: 'MINUTE',
    intervalNum: 1,
    limit: 1200
  },
  {
    rateLimitType: 'ORDERS',
    interval: 'SECOND',
    intervalNum: 10,
    limit: 300
  }
]
*/
async function getExchangeInfo() {
  return client
    .publicRequest('GET', '/fapi/v1/exchangeInfo', {})
    .then((res: { data: BianceExchangeInfoResponse }) => {
      return res.data;
    })
    .catch((error: any) => {
      logger.error(error);
      return [];
    });
}

async function getInstruments(): Promise<Array<Instrument>> {
  const tickersData: { data: BianceTicker[] } = await client.publicRequest(
    'GET',
    '/fapi/v1/ticker/24hr',
  );
  console.log(tickersData.data.length);
  return client
    .publicRequest('GET', '/fapi/v1/exchangeInfo', {})
    .then((res: { data: BianceExchangeInfoResponse }) => {
      return (
        res.data.symbols
          // U本位永续合约
          .filter((i: BianceSymbolInfo) => {
            return (
              i.contractType === 'PERPETUAL' &&
              i.marginAsset === 'USDT' &&
              i.status === 'TRADING'
            );
          })
          .map((i) => {
            let priceFilter: any;
            let lotSize: any;

            const ticker = tickersData.data.find((j) => j.symbol === i.symbol);

            if (i.filters && i.filters.length) {
              priceFilter = i.filters.filter(
                (i) => i.filterType === FilterType.PRICE_FILTER,
              )[0];

              lotSize = i.filters.filter(
                (i) => i.filterType === FilterType.LOT_SIZE,
              )[0];
            }

            return {
              instrument_id: i.symbol, // 合约ID，如BTCUSDT
              base_currency: i.baseAsset, // 交易货币币种，如：BTCUSDT中的BTC
              quote_currency: i.quoteAsset, // 计价货币币种，如：BTCUSDT中的USDT
              tick_size: priceFilter ? priceFilter.tickSize : '0', // 下单价格精度 0.01
              contract_val: '0', // 合约面值 100
              listing: i.onboardDate, // 创建时间 '2019-09-06'
              delivery: '', // 结算时间 '2019-09-20'
              size_increment: lotSize.stepSize, // swap 下单数量精度
              alias: 'swap', // 本周 this_week 次周 next_week 季度 quarter 永续 swap
              last: +ticker.lastPrice, // 最新成交价格
              chg_24h: +ticker.priceChange, // 24小时价格变化
              chg_rate_24h: +ticker.priceChangePercent, // 24小时价格变化(百分比)
              high_24h: ticker.highPrice, // 24小时最高价
              low_24h: ticker.lowPrice, // 24小时最低价
              volume_24h: ticker.quoteVolume, // 24小时成交量（按张数统计）
              timestamp: ticker.closeTime, // 系统时间 ISO_8601
              open_interest: '', // 持仓量
              open_24h: ticker.openPrice, // 24小时开盘价
              volume_token_24h: ticker.volume, // 	成交量（按币统计）
              exchange: Exchange.Biance,
            };
          })
      );
    })
    .catch((error: any) => {
      logger.error(error);
      return [];
    });
}

let status = 1;

async function getKlines(params: BianceKlineApiOpts) {
  if (status !== 1) {
    logger.error('[Biance] 接口受限 status code:' + status);
  }

  return client
    .publicRequest('GET', '/fapi/v1/klines', params)
    .then((res: { data: Array<BianceKline> }) => {
      // logger.info(
      //   `获取 [Biance/${params.symbol}/${params.interval}] K线: ${moment(
      //     params.startTime,
      //   ).format('YYYY-MM-DD HH:mm:ss')}至${moment(params.endTime).format(
      //     'MM-DD HH:mm:ss',
      //   )}, ${res.data.length} 条`,
      // );
      return res.data;
    })
    .catch((e: any) => {
      logger.error(
        `获取 [Biance/${params.symbol}/${params.interval}]: ${e.message}`,
      );
      if (e.message.indexOf('418') > -1) {
        status = 418;
      }

      if (e.message.indexOf('429') > -1) {
        status = 429;
      }
      return [];
    });
}

export { client, getExchangeInfo, getInstruments, setupWsClient, getKlines };
