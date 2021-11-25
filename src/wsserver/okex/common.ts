import PublicClient from './publicClient';
import { OKEX_HTTP_HOST } from '../../config';
import * as bluebird from 'bluebird';
import logger from '../../logger';
import { Business, Instrument, Candle, InstrumentReqOptions } from '../../types';
import { InstrumentCandleDao } from '../../dao';
import { sleep, getISOString } from '../../util';

const pClient = PublicClient(OKEX_HTTP_HOST, 10000);
const candles = [
  // 'candle60s', // 1 min
  // 'candle180s', // 3 mins
  'candle300s', // 5 mins
  'candle900s', // 15 mins
  'candle1800s', // 30 mins
  'candle3600s', // 1 hour
  'candle7200s', // 2 hours
  'candle14400s', // 4 hours
  'candle21600s', // 6 hours
  'candle43200s', // 12 hours
  'candle86400s', // 1 day
  // 'candle604800s', // 1 week
];

interface SimpleIntrument {
  instrument_id: string;
}

async function getSwapInstruments(): Promise<any> {
  return pClient.swap().getInstruments();
}

//获取合约K线数据 *永续合约*
async function getCandles({ instrumentId, start, end, granularity }: { instrumentId: string; start: string; end: string; granularity: number }): Promise<Array<Candle>> {
  try {
    const data = await pClient.swap().getCandles(instrumentId, { start, end, granularity });
    logger.info(`获取 ${instrumentId}/${granularity} K线成功: 从${start}至${end}, 共 ${data.length} 条`);
    return data;
  } catch (e) {
    logger.error(`获取 ${instrumentId}/${granularity} K线失败: 从${start}至${end}`);
    return [];
  }
}

function getSwapSubCommands(instruments: Array<Instrument | SimpleIntrument>): Array<string> {
  return getBasicCommands(instruments, Business.SWAP);
}

//指令格式:<business>/<channel>:<filter>
function getBasicCommands(instruments: Array<Instrument | SimpleIntrument>, business: Business): Array<string> {
  //公共Ticker频道
  // const tickerChannels = instruments.map((i: Instrument) => {
  //   return `${business}/ticker:${i.instrument_id}`;
  // });

  //公共-标记价格频道
  // const markPriceChannels = instruments.map((i: Instrument) => {
  //   return `${business}/mark_price:${i.instrument_id}`;
  // });

  // 公共-K线频道
  const candleChannels = [];
  instruments.map((i: Instrument | SimpleIntrument) => {
    candles.map((candle) => {
      candleChannels.push(`${business}/${candle}:${i.instrument_id}`);
    });
  });

  // return tickerChannels.concat(candleChannels).concat(markPriceChannels);
  return candleChannels;
}

async function getCandlesByGroup(options: Array<InstrumentReqOptions>) {
  bluebird.map(
    options,
    async (option: InstrumentReqOptions) => {
      const data: Array<Candle> = await getCandles({
        instrumentId: option.instrument_id,
        start: option.start,
        end: option.end,
        granularity: option.granularity,
      });

      const readyCandles = data.map((candle: Candle) => {
        return {
          instrument_id: option.instrument_id,
          underlying_index: option.underlying_index,
          quote_currency: option.quote_currency,
          timestamp: new Date(candle[0]),
          open: +candle[1],
          high: +candle[2],
          low: +candle[3],
          close: +candle[4],
          volume: +candle[5],
          currency_volume: +candle[6],
          alias: option.alias,
          granularity: option.granularity,
        };
      });

      return await InstrumentCandleDao.upsert(readyCandles);
    },
    { concurrency: 5 }
  );
}

async function getCandlesWithLimitedSpeed(options: Array<InstrumentReqOptions>) {
  //设置系统限速规则: 10次/2s (okex官方API 限速规则：20次/2s)
  const groupCount = Math.round(options.length / 10);
  let start = 0;
  await bluebird.map(
    new Array(groupCount).fill(null),
    async () => {
      await getCandlesByGroup(options.slice(start, start + 10));
      start += 10;
      return sleep(2);
    },
    { concurrency: 1 }
  );
}

export { getSwapInstruments, getCandles, getCandlesWithLimitedSpeed, getCandlesByGroup, getBasicCommands, getSwapSubCommands };
