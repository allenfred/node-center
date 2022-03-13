const { Spot } = require('@binance/connector');
import { Instrument, Exchange, BianceExchangeInfoResponse, BianceSymbolInfo, BianceKline, BianceKlineApiOpts, FilterType, BianceWsMsg } from '../../types';
import logger from '../../logger';
import { InstrumentInfoDao } from '../../dao';
import { handleMsg } from './handler';

const client = new Spot('', '', {
  baseURL: 'https://fapi.binance.com',
  wsURL: 'wss://fstream.binance.com', // If optional base URL is not provided, wsURL defaults to wss://stream.binance.com:9443
});

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
    message: (data: BianceWsMsg) => {
      handleMsg(data);
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
      return res.data;
    })
    .catch((error: any) => {
      logger.error(error);
      return [];
    });
}

export { client, getBianceSwapInsts, setupBianceWsClient, getBianceKlines };
