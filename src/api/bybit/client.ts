const { LinearClient } = require('bybit-api');
import {
  SymbolInfo,
  SymbolIntervalFromLimitParam,
  APIResponse,
  APIResponseWithTime,
  WebsocketClient,
} from 'bybit-api';
import {
  Instrument,
  Exchange,
  BybitTicker,
  BybitKline,
  BybitWsKline,
  BybitWsMsg,
} from '../../types';
import logger from '../../logger';
import { InstrumentInfoDao, InstrumentKlineDao } from '../../dao';
import { isKlineMsg, isTickerMsg, getKlineSubChannel } from './util';

const API_KEY = 'mbcEkFhTDDb6nMtWCK';
const PRIVATE_KEY = 'sDebFOPwH0Hn9bPl8j7WPXrlw1DIYHMF6yCS';
const useLivenet = true;

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
  const intervals = ['15', '60'];

  // support combined stream, e.g.
  const instruments: Instrument[] = await InstrumentInfoDao.findByTopVolume({
    exchange: Exchange.Bybit,
    limit: 20,
  });
  const klineStreams = [];
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

  wsClient.on('update', (data) => {
    if (data.topic.includes('candle') && data.data[0].confirm) {
      handleKlines(data);
    }
  });

  wsClient.on('open', (data) => {
    logger.info('[Bybit] ws open:' + data.wsKey);
    wsClient.subscribe(klineStreams);
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

export async function getTickers() {
  const tickers: APIResponse<BybitTicker[]> = await client.getTickers();
  // U本位永续合约
  return tickers.result
    .filter((i: BybitTicker) => {
      return i.symbol === 'USDT';
    })
    .map((ticker: BybitTicker) => {
      return {
        instrument_id: ticker.symbol, // 合约ID，如BTCUSDT
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

export { client, getInstruments, setupWsClient, getKlines };
