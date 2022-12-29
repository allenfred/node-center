const { LinearClient } = require('bybit-api');
import {
  SymbolInfo,
  SymbolIntervalFromLimitParam,
  APIResponse,
} from 'bybit-api';
import { Instrument, Exchange, BybitTicker, BybitKline } from '../../types';
import logger from '../../logger';

const API_KEY = 'iS12CdTOC1SmCs5kQ0';
const PRIVATE_KEY = 'Vz2L9UokimS6bz5ePwTHzWhcUXkd1qlul3MI';
const useLivenet = true;

const client = new LinearClient(
  API_KEY,
  PRIVATE_KEY,
  // optional, uses testnet by default. Set to 'true' to use livenet.
  useLivenet,
  // restClientOptions,
  // requestLibraryOptions
);

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
        chg_rate_24h: +ticker.price_24h_pcnt * 100, // 24小时价格变化(百分比)
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

export { getInstruments, getKlines };
