import * as bluebird from 'bluebird';
import { Exchange, Instrument, BianceKline, InstReqOptions, BianceKlineApiOpts } from '../../types';
import { InstrumentKlineDao } from '../../dao';
import { getTimestamp } from '../../util';
import { getBianceKlines } from './client';

const BianceKlineInterval = {
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

async function getKlinesWithLimited(options: Array<InstReqOptions>) {
  //设置系统限速规则 (biance官方API 限速规则：2400次/60s)
  return bluebird.map(
    options,
    async (option: any) => {
      return Promise.resolve()
        .then(() => {
          return getBianceKlines({
            symbol: option.instrument_id,
            interval: BianceKlineInterval[option.granularity],
            startTime: option.start,
            endTime: option.end,
            limit: 1500,
          });
        })
        .then((data: Array<BianceKline>) => {
          const readyKlines = data.map((kline: BianceKline) => {
            return {
              instrument_id: option.instrument_id,
              underlying_index: option.instrument_id.replace('USDT', ''),
              quote_currency: 'USDT',
              timestamp: new Date(+kline[0]),
              open: +kline[1],
              high: +kline[2],
              low: +kline[3],
              close: +kline[4],
              volume: +kline[5],
              currency_volume: +kline[7],
              granularity: option.granularity,
              exchange: Exchange.Biance,
            };
          });
          return InstrumentKlineDao.upsert(readyKlines);
        });
    },
    { concurrency: 5 }
  );
}

// 获取过去1000条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
async function getMaxKlines(instrumentId: string) {
  const reqOptions = [];
  reqOptions.push({
    instrument_id: instrumentId,
    start: getTimestamp(15 * -1000, 'm'),
    end: getTimestamp(0, 'm'),
    granularity: 900, // 15m
  });

  reqOptions.push({
    instrument_id: instrumentId,
    start: getTimestamp(30 * -1000, 'm'),
    end: getTimestamp(0, 'm'),
    granularity: 1800, // 30m
  });

  reqOptions.push({
    instrument_id: instrumentId,
    start: getTimestamp(-1000, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 3600, // 1h
  });

  reqOptions.push({
    instrument_id: instrumentId,
    start: getTimestamp(2 * -1000, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 7200, // 2h
  });

  reqOptions.push({
    instrument_id: instrumentId,
    start: getTimestamp(4 * -1000, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 14400, // 4h
  });

  reqOptions.push({
    instrument_id: instrumentId,
    start: getTimestamp(6 * -1000, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 21600, // 6h
  });

  reqOptions.push({
    instrument_id: instrumentId,
    start: getTimestamp(12 * -1000, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 43200, // 12h
  });

  reqOptions.push({
    instrument_id: instrumentId,
    start: getTimestamp(24 * -1000, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 86400, // 1d
  });

  return await getKlinesWithLimited(reqOptions);
}

// 获取过去2000条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
async function getMaxKlinesWithGranularity(instrumentId: string, granularity: number): Promise<any> {
  const reqOptions = [];
  for (let i = 0; i < 20; i++) {
    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * granularity * -100, 's'),
      end: getTimestamp(i * granularity * -100, 's'),
      granularity,
    });
  }

  return await getKlinesWithLimited(reqOptions);
}

// 获取最近100条k线数据 (15m 30m 1h 2h 4h 6h 12h 1d)
async function getLatestKlines(instrumentId: any) {
  const reqOptions = [];

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getTimestamp(15 * -100, 'm'),
        end: getTimestamp(0, 'm'),
        granularity: 900, // 15m
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getTimestamp(30 * -100, 'm'),
        end: getTimestamp(0, 'm'),
        granularity: 1800, // 30m
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getTimestamp(1 * -100, 'h'),
        end: getTimestamp(0, 'h'),
        granularity: 3600, // 1h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getTimestamp(2 * -100, 'h'),
        end: getTimestamp(0, 'h'),
        granularity: 7200, // 2h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getTimestamp(4 * -100, 'h'),
        end: getTimestamp(0, 'h'),
        granularity: 14400, // 4h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getTimestamp(6 * -100, 'h'),
        end: getTimestamp(0, 'h'),
        granularity: 21600, // 6h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getTimestamp(12 * -100, 'h'),
        end: getTimestamp(0, 'h'),
        granularity: 43200, // 12h
      }
    )
  );

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getTimestamp(24 * -100, 'h'),
        end: getTimestamp(0, 'h'),
        granularity: 86400, // 1d
      }
    )
  );

  return await getKlinesWithLimited(reqOptions);
}

export { getKlinesWithLimited, getMaxKlines, getMaxKlinesWithGranularity, getLatestKlines };
