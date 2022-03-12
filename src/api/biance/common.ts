import { OKEX_HTTP_HOST } from '../../config';
import * as bluebird from 'bluebird';
import logger from '../../logger';
import { Business, Instrument, Candle, InstrumentReqOptions } from '../../types';
import { InstrumentCandleDao } from '../../dao';
import { getISOString } from '../../util';
import * as moment from 'moment';
import { getPerpetualInstruments, getKlines } from './client';
import { BianceExchangeInfoResponse, BianceSymbolInfo, KlineApiParams } from '../../types';

const candleChannels = [
  'candle5m', // 5 mins
  'candle15m', // 15 mins
  'candle30m', // 30 mins
  'candle1H', // 1 hour
  'candle2H', // 2 hours
  'candle4H', // 4 hours
  'candle6H', // 6 hours
  'candle12H', // 12 hours
  'candle1D', // 1 day
  'candle1W', // 1 week
];

const KlineInterval = {
  300: '5m',
  900: '15m',
  1800: '30m',
  3600: '1h',
  7200: '2h',
  14400: '4h',
  21600: '6h',
  43200: '12h',
  86400: '1d',
  604800: '1w',
};

interface SimpleIntrument {
  instrument_id: string;
}

async function getSwapInstruments(): Promise<Array<Instrument>> {
  const data: Array<BianceSymbolInfo> = await getPerpetualInstruments();
  if (data.length) {
    return data.map((i) => {
      let priceFilter: any;
      if (i.filters && i.filters.length) {
        priceFilter = i.filters.find((i) => i.filterType === 'PRICE_FILTER');
      }

      return {
        instrument_id: i.baseAsset + '-' + i.quoteAsset + '-SWAP', // 合约ID，如BTC-USDT-SWAP
        underlying_index: i.baseAsset, // 交易货币币种，如：BTC-USDT-SWAP中的BTC
        quote_currency: i.quoteAsset, // 计价货币币种，如：BTC-USDT-SWAP中的USDT
        tick_size: priceFilter ? priceFilter.tickSize : '0', // 下单价格精度 0.01
        contract_val: '0', // 合约面值 100
        listing: '', // 创建时间 '2019-09-06'
        delivery: '', // 结算时间 '2019-09-20'
        trade_increment: '', // futures 下单数量精度
        size_increment: '1', // swap 下单数量精度
        alias: 'swap', // 本周 this_week 次周 next_week 季度 quarter 永续 swap
        settlement_currency: i.baseAsset, // 盈亏结算和保证金币种，BTC
        contract_val_currency: i.marginAsset, // 合约面值计价币种
      };
    });
  } else {
    return [];
  }
}

// V5 获取合约K线数据
async function getCandles({ instrumentId, start, end, granularity }: { instrumentId: string; start: string; end: string; granularity: number }): Promise<Array<Candle>> {
  try {
    const data = await getKlines({ symbol: instrumentId, startTime: new Date(start).valueOf(), endTime: new Date(end).valueOf(), interval: KlineInterval[+granularity] } as KlineApiParams);
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

function getSwapSubCommands(instruments: Instrument[]): Array<string> {
  return getBasicCommands(instruments, Business.SWAP);
}

//指令格式:<business>/<channel>:<filter>
function getBasicCommands(instruments: Instrument[], business: Business): Array<string> {
  // 公共-K线频道
  const channels = [];
  instruments.map((i: Instrument | SimpleIntrument) => {
    candleChannels.map((candleChannel) => {
      if (candleChannel === 'candle5m') {
        if (i.instrument_id.indexOf('BTC') > -1) {
          channels.push({ channel: candleChannel, instId: i.instrument_id });
        }
      } else {
        channels.push({ channel: candleChannel, instId: i.instrument_id });
      }
    });
  });

  //公共Ticker频道
  const tickerChannels = instruments.map((i: Instrument) => {
    return `${business}/ticker:${i.instrument_id}`;
  });

  //公共-交易频道
  const tradeChannels = instruments.map((i: Instrument) => {
    return `${business}/trade:${i.instrument_id}`;
  });

  //公共-限价频道
  const priceRangeChannels = instruments.map((i: Instrument) => {
    return `${business}/price_range:${i.instrument_id}`;
  });

  //公共-100档深度频道
  const depthChannels = instruments.map((i: Instrument) => {
    return `${business}/depth:${i.instrument_id}`;
  });

  //公共-标记价格频道
  const markPriceChannels = instruments.map((i: Instrument) => {
    return `${business}/mark_price:${i.instrument_id}`;
  });

  // return (
  //   tickerChannels
  //     .concat(candleChannels)
  //     .concat(tradeChannels)
  //     .concat(priceRangeChannels)
  //     // .concat(depthChannels)
  //     .concat(markPriceChannels)
  // );
  return channels;
}

async function getCandlesWithLimitedSpeed(options: Array<InstrumentReqOptions>) {
  //设置系统限速规则: 5次/2s (Biance官方API 限速规则：20次/2s)
  return bluebird.map(
    options,
    (option: any) => {
      return Promise.resolve()
        .then(() => {
          return getCandles({
            instrumentId: option.instrument_id,
            start: option.start,
            end: option.end,
            granularity: option.granularity,
          });
        })
        .then((data: Array<Candle>) => {
          const readyCandles = data.map((candle: Candle) => {
            return {
              instrument_id: option.instrument_id,
              underlying_index: option.instrument_id.split('-')[0],
              quote_currency: option.instrument_id.split('-')[1],
              timestamp: new Date(+candle[0]),
              open: +candle[1],
              high: +candle[2],
              low: +candle[3],
              close: +candle[4],
              volume: +candle[5],
              currency_volume: +candle[6],
              granularity: option.granularity,
            };
          });

          return InstrumentCandleDao.upsert(readyCandles);
        });
    },
    { concurrency: 5 }
  );
}

// 获取最多过去1000条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
async function getMaxCandles(instrumentId: string) {
  const reqOptions = [];
  for (let i = 0; i < 10; i++) {
    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 15 * -100, 'm'),
      end: getISOString(i * 15 * -100, 'm'),
      granularity: 900, // 15m
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 30 * -100, 'm'),
      end: getISOString(i * 30 * -100, 'm'),
      granularity: 1800, // 30m
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * -100, 'h'),
      end: getISOString(i * -100, 'h'),
      granularity: 3600, // 1h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 2 * -100, 'h'),
      end: getISOString(i * 2 * -100, 'h'),
      granularity: 7200, // 2h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 4 * -100, 'h'),
      end: getISOString(i * 4 * -100, 'h'),
      granularity: 14400, // 4h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 6 * -100, 'h'),
      end: getISOString(i * 6 * -100, 'h'),
      granularity: 21600, // 6h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 12 * -100, 'h'),
      end: getISOString(i * 12 * -100, 'h'),
      granularity: 43200, // 12h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 24 * -100, 'h'),
      end: getISOString(i * 24 * -100, 'h'),
      granularity: 86400, // 1d
    });
  }

  return await getCandlesWithLimitedSpeed(reqOptions);
}

// 获取过去2000条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
async function getMaxCandlesWithGranularity(instrumentId: string, granularity: number): Promise<any> {
  const reqOptions = [];
  for (let i = 0; i < 20; i++) {
    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * granularity * -100, 's'),
      end: getISOString(i * granularity * -100, 's'),
      granularity,
    });
  }

  return await getCandlesWithLimitedSpeed(reqOptions);
}

// 获取最近100条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
async function getLatestCandles(instrumentId: any) {
  const reqOptions = [];

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getISOString(15 * -100, 'm'),
        end: getISOString(0, 'm'),
        granularity: 900, // 15min
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getISOString(30 * -100, 'm'),
        end: getISOString(0, 'm'),
        granularity: 1800, // 30min
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getISOString(1 * -100, 'h'),
        end: getISOString(0, 'h'),
        granularity: 3600, // 1h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getISOString(2 * -100, 'h'),
        end: getISOString(0, 'h'),
        granularity: 7200, // 2h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getISOString(4 * -100, 'h'),
        end: getISOString(0, 'h'),
        granularity: 14400, // 4h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getISOString(6 * -100, 'h'),
        end: getISOString(0, 'h'),
        granularity: 21600, // 6h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getISOString(12 * -100, 'h'),
        end: getISOString(0, 'h'),
        granularity: 43200, // 12h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getISOString(24 * -100, 'h'),
        end: getISOString(0, 'h'),
        granularity: 86400, // 1d
      }
    )
  );

  return await getCandlesWithLimitedSpeed(reqOptions);
}

export { getSwapInstruments, getCandles, getCandlesWithLimitedSpeed, getBasicCommands, getSwapSubCommands, getMaxCandles, getMaxCandlesWithGranularity, getLatestCandles };
