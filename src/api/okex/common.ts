import * as bluebird from 'bluebird';
import { Exchange, OkxKline, InstReqOptions } from '../../types';
import { InstrumentKlineDao } from '../../dao';
import { getTimestamp } from '../../util';
import { getOkxKlines } from './client';

async function getKlinesWithLimited(options: Array<InstReqOptions>) {
  //设置系统限速规则: 5次/2s (okex官方API 限速规则：20次/2s)
  return bluebird.map(
    options,
    (option: any) => {
      return Promise.resolve()
        .then(() => {
          return getOkxKlines({
            instrumentId: option.instrument_id,
            start: option.start,
            end: option.end,
            granularity: option.granularity,
          });
        })
        .then((data: Array<OkxKline>) => {
          const readyKlines = data.map((candle: OkxKline) => {
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
              exchange: Exchange.Okex,
            };
          });

          return InstrumentKlineDao.upsert(readyKlines);
        });
    },
    { concurrency: 5 }
  );
}

// 获取最多过去1000条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
async function getMaxKlines(instrumentId: string) {
  const reqOptions = [];
  for (let i = 0; i < 10; i++) {
    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 15 * -100, 'm'),
      end: getTimestamp(i * 15 * -100, 'm'),
      granularity: 900, // 15m
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 30 * -100, 'm'),
      end: getTimestamp(i * 30 * -100, 'm'),
      granularity: 1800, // 30m
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * -100, 'h'),
      end: getTimestamp(i * -100, 'h'),
      granularity: 3600, // 1h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 2 * -100, 'h'),
      end: getTimestamp(i * 2 * -100, 'h'),
      granularity: 7200, // 2h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 4 * -100, 'h'),
      end: getTimestamp(i * 4 * -100, 'h'),
      granularity: 14400, // 4h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 6 * -100, 'h'),
      end: getTimestamp(i * 6 * -100, 'h'),
      granularity: 21600, // 6h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 12 * -100, 'h'),
      end: getTimestamp(i * 12 * -100, 'h'),
      granularity: 43200, // 12h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 24 * -100, 'h'),
      end: getTimestamp(i * 24 * -100, 'h'),
      granularity: 86400, // 1d
    });
  }

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

// 获取最近100条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
async function getLatestKlines(instrumentId: any) {
  const reqOptions = [];

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instrumentId,
        start: getTimestamp(15 * -100, 'm'),
        end: getTimestamp(0, 'm'),
        granularity: 900, // 15min
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
        granularity: 1800, // 30min
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
