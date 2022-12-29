const { Spot } = require('@binance/connector');
import {
  Instrument,
  Exchange,
  BinanceExchangeInfoResponse,
  BinanceSymbolInfo,
  BinanceKline,
  BinanceKlineApiOpts,
  FilterType,
  BinanceTicker,
} from '../../types';
import logger from '../../logger';

const client = new Spot('', '', {
  baseURL: 'https://fapi.binance.com',
  wsURL: 'wss://fstream.binance.com', // If optional base URL is not provided, wsURL defaults to wss://stream.binance.com:9443
});

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
    .then((res: { data: BinanceExchangeInfoResponse }) => {
      return res.data;
    })
    .catch((error: any) => {
      logger.error(error);
      return [];
    });
}

async function getInstruments(): Promise<Array<Instrument>> {
  const tickersData: { data: BinanceTicker[] } = await client.publicRequest(
    'GET',
    '/fapi/v1/ticker/24hr',
  );
  return client
    .publicRequest('GET', '/fapi/v1/exchangeInfo', {})
    .then((res: { data: BinanceExchangeInfoResponse }) => {
      return (
        res.data.symbols
          // U本位永续合约
          .filter((i: BinanceSymbolInfo) => {
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
              exchange: Exchange.Binance,
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

async function getKlines(params: BinanceKlineApiOpts) {
  if (status !== 1) {
    logger.error('[Binance] 接口受限 status code:' + status);
  }

  return client
    .publicRequest('GET', '/fapi/v1/klines', params)
    .then((res: { data: Array<BinanceKline> }) => {
      return res.data;
    })
    .catch((e: any) => {
      logger.error(
        `获取 [Binance/${params.symbol}/${params.interval}]: ${e.message}`,
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

export { getExchangeInfo, getInstruments, getKlines };
