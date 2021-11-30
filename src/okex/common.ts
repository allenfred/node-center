import PublicClient from './publicClient';
import PublicClientV5 from './publicClientV5';
import { OKEX_HTTP_HOST } from '../config';
import * as bluebird from 'bluebird';
import logger from '../logger';
import { Business, Instrument, Candle, InstrumentReqOptions } from '../types';
import { InstrumentCandleDao } from '../dao';
import { getISOString } from '../util';

const pClient = PublicClient(OKEX_HTTP_HOST, 10000);
const pClientV5 = PublicClientV5(OKEX_HTTP_HOST, 10000);
const candles = [
  'candle300s', // 5 mins
  'candle900s', // 15 mins
  'candle1800s', // 30 mins
  'candle3600s', // 1 hour
  'candle7200s', // 2 hours
  'candle14400s', // 4 hours
  'candle21600s', // 6 hours
  'candle43200s', // 12 hours
  'candle86400s', // 1 day
  'candle604800s', // 1 week
];

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
  // 'candle1W', // 1 week
];

const Bar_Type = {
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

async function getSwapInstruments(): Promise<any> {
  return pClient.swap().getInstruments();
}

// V3 获取合约K线数据
// async function getCandles({ instrumentId, start, end, granularity }: { instrumentId: string; start: string; end: string; granularity: number }): Promise<Array<Candle>> {
//   try {
//     const data = await pClient.swap().getCandles(instrumentId, { start, end, granularity });
//     logger.info(`获取 ${instrumentId}/${granularity} K线成功: 从${start}至${end}, 共 ${data.length} 条`);
//     return data;
//   } catch (e) {
//     logger.error(`获取 ${instrumentId}/${granularity} K线失败: 从${start}至${end}`);
//     return [];
//   }
// }

// V5 获取合约K线数据
async function getCandles({ instrumentId, start, end, granularity }: { instrumentId: string; start: string; end: string; granularity: number }): Promise<Array<Candle>> {
  try {
    const data = await pClientV5.swap().getCandles({ instId: instrumentId, before: new Date(start).valueOf(), bar: Bar_Type[+granularity] });
    if (+data.code === 0) {
      logger.info(`获取 ${instrumentId}/${Bar_Type[+granularity]} K线成功: 共 ${data.data.length} 条`);
      return data.data;
    } else {
      logger.error(`获取 ${instrumentId}/${Bar_Type[+granularity]} K线失败: ${data.msg}`);
      return [];
    }
  } catch (e) {
    logger.error(`获取 ${instrumentId}/${Bar_Type[+granularity]} Catch Error: ${e}`);
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

  //公共-200档深度频道
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
  //设置系统限速规则: 5次/2s (okex官方API 限速规则：20次/2s)
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
              underlying_index: option.underlying_index,
              quote_currency: option.quote_currency,
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

// 获取最多过去1440条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
async function getMaxCandles(instrumentId: string) {
  const reqOptions = [];
  for (let i = 0; i < 10; i++) {
    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 15 * -200, 'm'),
      end: getISOString(i * 15 * -200, 'm'),
      granularity: 900, // 15m
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 30 * -200, 'm'),
      end: getISOString(i * 30 * -200, 'm'),
      granularity: 1800, // 30m
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * -200, 'h'),
      end: getISOString(i * -200, 'h'),
      granularity: 3600, // 1h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 2 * -200, 'h'),
      end: getISOString(i * 2 * -200, 'h'),
      granularity: 7200, // 2h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 4 * -200, 'h'),
      end: getISOString(i * 4 * -200, 'h'),
      granularity: 14400, // 4h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 6 * -200, 'h'),
      end: getISOString(i * 6 * -200, 'h'),
      granularity: 21600, // 6h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 12 * -200, 'h'),
      end: getISOString(i * 12 * -200, 'h'),
      granularity: 43200, // 12h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getISOString((i + 1) * 24 * -200, 'h'),
      end: getISOString(i * 24 * -200, 'h'),
      granularity: 86400, // 1d
    });
  }

  return await getCandlesWithLimitedSpeed(reqOptions);
}

// 获取最近200条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
async function getLatestCandles(instrumentId: any) {
  const reqOptions = [];

  // reqOptions.push(
  //   Object.assign(
  //     {},
  //     {
  //       instrument_id: instrumentId,
  //       start: getISOString(5 * -200, 'm'),
  //       end: getISOString(0, 'm'),
  //       granularity: 300, // 5min
  //     }
  //   )
  // );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getISOString(15 * -200, 'm'),
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
        start: getISOString(30 * -200, 'm'),
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
        start: getISOString(1 * -200, 'h'),
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
        start: getISOString(2 * -200, 'h'),
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
        start: getISOString(4 * -200, 'h'),
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
        start: getISOString(6 * -200, 'h'),
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
        start: getISOString(12 * -200, 'h'),
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
        start: getISOString(24 * -200, 'h'),
        end: getISOString(0, 'h'),
        granularity: 86400, // 1d
      }
    )
  );

  return await getCandlesWithLimitedSpeed(reqOptions);
}

export { getSwapInstruments, getCandles, getCandlesWithLimitedSpeed, getBasicCommands, getSwapSubCommands, getMaxCandles, getLatestCandles };
