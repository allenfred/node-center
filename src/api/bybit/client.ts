const { LinearClient } = require('bybit-api');
import {
  SymbolInfo,
  SymbolIntervalFromLimitParam,
  APIResponse,
  APIResponseWithTime,
  WebsocketClient,
} from 'bybit-api';
import * as moment from 'moment';
import { Instrument, Exchange, BybitTicker } from '../../types';
import logger from '../../logger';
import { InstrumentInfoDao, InstrumentKlineDao } from '../../dao';
import redisClient from '../../redis/client';
import { isKlineMsg, isTickerMsg, getKlineSubChannel } from './util';
import { BybitKline } from '../../types/bybit';

const API_KEY = null;
const PRIVATE_KEY = null;
const useLivenet = false;

const client = new LinearClient(
  API_KEY,
  PRIVATE_KEY,
  // optional, uses testnet by default. Set to 'true' to use livenet.
  useLivenet,
  // restClientOptions,
  // requestLibraryOptions
);

async function setupWsClient(clients: any[]) {
  // const intervals = ['15m', '1h', '4h'];
  const intervals = ['15m', '1h'];

  // support combined stream, e.g.
  const instruments: Instrument[] = await InstrumentInfoDao.findByTopVolume({
    exchange: Exchange.Bybit,
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

  const wsClient = new WebsocketClient(
    {
      // key: key,
      // secret: secret,
      market: 'linear',
      linear: true,
      livenet: true,
    },
    logger,
  );

  wsClient.connectPublic();

  wsClient.on('update', (data) => {
    console.log('raw message received ', JSON.stringify(data, null, 2));
  });

  wsClient.on('open', (data) => {
    console.log('connection opened open:', data.wsKey);
    wsClient.subscribe('candle.15.BTCUSDT');
  });

  wsClient.on('response', (data) => {
    console.log('log response: ', JSON.stringify(data, null, 2));
  });

  wsClient.on('reconnect', ({ wsKey }) => {
    console.log('ws automatically reconnecting.... ', wsKey);
  });

  wsClient.on('reconnected', (data) => {
    console.log('ws has reconnected ', data?.wsKey);
  });
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
async function getInstruments(): Promise<Array<Instrument>> {
  const tickers: APIResponse<BybitTicker[]> = await client.getTickers();
  const symbols: APIResponse<SymbolInfo[]> = await client.getSymbols();

  // U本位永续合约
  return symbols.result
    .filter((i: SymbolInfo) => {
      return i.quote_currency === 'USDT' && i.status === 'Trading';
    })
    .map((i) => {
      let priceFilter: any;
      let lotSize: any;

      if (i.price_filter) {
        priceFilter = i.price_filter;
        lotSize = i.lot_size_filter;
      }

      const ticker = tickers.result.find((j) => j.symbol === i.name);

      return {
        instrument_id: i.name, // 合约ID，如BTCUSDT
        base_currency: i.base_currency, // 交易货币币种，如：BTCUSDT中的BTC
        quote_currency: i.quote_currency, // 计价货币币种，如：BTCUSDT中的USDT
        tick_size: priceFilter.tick_size, // 下单价格精度 0.01
        contract_val: lotSize.qty_step, // 合约面值 100
        listing: '', // 创建时间 '2019-09-06'
        delivery: '', // 结算时间 '2019-09-20'
        size_increment: lotSize.stepSize, // swap 下单数量精度
        alias: 'swap', // 本周 this_week 次周 next_week 季度 quarter 永续 swap
        last: +ticker.last_price, // 最新成交价格
        chg_24h: +ticker.last_price - +ticker.prev_price_24h, // 24小时价格变化
        chg_rate_24h: +ticker.price_24h_pcnt, // 24小时价格变化(百分比)
        high_24h: +ticker.high_price_24h, // 24小时最高价
        low_24h: +ticker.low_price_24h, // 24小时最低价
        volume_24h: +ticker.turnover_24h, // 24小时成交量（按张数统计）
        timestamp: null, // 系统时间 ISO_8601
        open_interest: ticker.open_interest, // 持仓量
        open_24h: +ticker.prev_price_24h, // 24小时开盘价
        volume_token_24h: ticker.volume_24h, // 	成交量（按币统计）
        exchange: Exchange.Bybit,
      };
    });
}

async function getKlines(param: SymbolIntervalFromLimitParam) {
  return client
    .getKline(param)
    .then((res: { ret_code: number; result: Array<BybitKline> }) => {
      return res.result;
    })
    .catch((e: any) => {
      logger.error(
        `获取 [Bybit/${param.symbol}/${param.interval}]: ${e.message}`,
      );
      if (e.message.indexOf('403') > -1) {
        logger.error('接口受限');
      }
      return [];
    });
}

export { client, getInstruments, setupWsClient, getKlines };
