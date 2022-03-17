const { Spot } = require('@binance/connector');
import * as moment from 'moment';
import { Instrument, Exchange, BianceExchangeInfoResponse, BianceSymbolInfo, BianceKline, BianceKlineApiOpts, FilterType, BianceWsMsg, BianceKlineChannel } from '../../types';
import logger from '../../logger';
import { InstrumentInfoDao, InstrumentTickerDao } from '../../dao';

const client = new Spot('', '', {
  baseURL: 'https://fapi.binance.com',
  wsURL: 'wss://fstream.binance.com', // If optional base URL is not provided, wsURL defaults to wss://stream.binance.com:9443
});

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
            .filter((i) => i.s.endsWith('USDT'))
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

async function setupBianceWsClient(clients: any) {
  const intervals = ['15m', '30m', '1h', '2h', '4h'];
  // support combined stream, e.g.
  const instruments: Instrument[] = await InstrumentInfoDao.find({ exchange: Exchange.Biance });
  const klineStreams = [];
  instruments.forEach((e) => {
    intervals.forEach((i) => {
      klineStreams.push(e.instrument_id.replace('-', '') + '@kline_' + i);
    });
  });

  // !miniTicker@arr 全市场的精简Ticker
  // !ticker@arr 全市场的完整Ticker
  const combinedStreams = client.combinedStreams(['!ticker@arr'], {
    open: () => {
      logger.info('!!! 与Biance wsserver建立连接成功 !!!');
    },
    close: () => {
      logger.error('!!! 与Biance wsserver断开连接 !!!');
    },
    message: (data: any) => {
      broadCastMsg(JSON.parse(data), clients);
      handleMsg(JSON.parse(data));
    },
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
async function getBianceSwapInsts(): Promise<Array<Instrument>> {
  return client
    .publicRequest('GET', '/fapi/v1/exchangeInfo', {})
    .then((res: { data: BianceExchangeInfoResponse }) => {
      return res.data.symbols
        .filter((i: BianceSymbolInfo) => i.contractType === 'PERPETUAL')
        .map((i) => {
          let priceFilter: any;
          let lotSize: any;

          if (i.filters && i.filters.length) {
            priceFilter = i.filters.filter((i) => i.filterType === FilterType.PRICE_FILTER);
            lotSize = i.filters.filter((i) => i.filterType === FilterType.LOT_SIZE);
          }

          return {
            instrument_id: i.symbol, // 合约ID，如BTCUSDT
            underlying_index: i.baseAsset, // 交易货币币种，如：BTCUSDT中的BTC
            quote_currency: i.quoteAsset, // 计价货币币种，如：BTCUSDT中的USDT
            tick_size: priceFilter ? priceFilter.tickSize : '0', // 下单价格精度 0.01
            contract_val: '0', // 合约面值 100
            listing: i.onboardDate, // 创建时间 '2019-09-06'
            delivery: '', // 结算时间 '2019-09-20'
            trade_increment: '0', // futures 下单数量精度
            size_increment: lotSize.stepSize, // swap 下单数量精度
            alias: 'swap', // 本周 this_week 次周 next_week 季度 quarter 永续 swap
            settlement_currency: i.marginAsset, // 盈亏结算和保证金币种，BTC
            contract_val_currency: i.quoteAsset, // 合约面值计价币种
            exchange: Exchange.Biance,
          };
        });
    })
    .catch((error: any) => {
      logger.error(error);
      return [];
    });
}

async function getBianceKlines(params: BianceKlineApiOpts) {
  return client
    .publicRequest('GET', '/fapi/v1/klines', params)
    .then((res: { data: Array<BianceKline> }) => {
      logger.info(
        `获取 [Biance] ${params.symbol}/${params.interval} K线成功: 从${moment(params.startTime).format('YYYY-MM-DD HH:mm:ss')}至${moment(params.endTime).format('YYYY-MM-DD HH:mm:ss')}, 共 ${
          res.data.length
        } 条`
      );
      return res.data;
    })
    .catch((error: any) => {
      logger.error(error);
      return [];
    });
}

export { client, getBianceSwapInsts, setupBianceWsClient, getBianceKlines };
