import * as bluebird from 'bluebird';
import {
  Exchange,
  Instrument,
  OkxKline,
  BianceKline,
  InstReqOptions,
  BianceKlineApiOpts,
} from '../types';
import { InstrumentKlineDao } from '../dao';
import { getTimestamp } from '../util';
import { getBianceKlines } from './biance/client';
import { getOkxKlines } from './okex/client';

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

async function getKlinesWithLimited(
  options: Array<InstReqOptions>,
): Promise<any> {
  //设置系统限速规则 (biance官方API 限速规则：2400次/60s)
  return bluebird.map(
    options,
    async (option: any) => {
      const { exchange } = option;
      return Promise.resolve()
        .then(() => {
          if (exchange === Exchange.Biance) {
            return getBianceKlines({
              symbol: option.instrument_id,
              interval: BianceKlineInterval[option.granularity],
              startTime: new Date(option.start).valueOf(),
              endTime: new Date(option.end).valueOf(),
              limit: 1500,
            });
          } else if (exchange === Exchange.Okex) {
            return getOkxKlines({
              instrumentId: option.instrument_id,
              granularity: option.granularity,
              start: new Date(option.start).valueOf(),
              end: new Date(option.end).valueOf(),
            });
          }
        })
        .then((data: Array<any>) => {
          let klines = [];
          if (exchange === Exchange.Okex) {
            klines = data.map((candle: OkxKline) => {
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
          } else if (exchange === Exchange.Biance) {
            klines = data.map((kline: BianceKline) => {
              return {
                instrument_id: option.instrument_id,
                underlying_index: option.instrument_id.replace('USDT', ''),
                quote_currency: 'USDT',
                timestamp: new Date(+kline[0]),
                open: +kline[1],
                high: +kline[2],
                low: +kline[3],
                close: +kline[4],
                volume: +kline[5], //
                currency_volume: +kline[7],
                granularity: option.granularity,
                exchange: Exchange.Biance,
              };
            });
          }

          return InstrumentKlineDao.upsert(klines);
        });
    },
    { concurrency: 5 },
  );
}

// 获取最近100条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
// For BTC (15min 30min 1h 2h 4h 6h 12h 1d)
// For Others (15min 1h 4h 1d)
async function getKlines(opts: {
  exchange: Exchange;
  instId: any;
  start?: any;
  end?: any;
  count?: number;
  days?: number;
}) {
  const reqOptions = [];
  let count = 200;

  if (opts && opts.count > 0) {
    count = opts.count;
  }

  const { instId } = opts;

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instId,
        start: opts.start || getTimestamp(15 * -count, 'm'),
        end: opts.end || getTimestamp(0, 'm'),
        granularity: 900, // 15min
      },
    ),
  );

  if (opts.instId.indexOf('BTC') !== -1) {
    reqOptions.push(
      Object.assign(
        {},
        {
          instrument_id: instId,
          start: opts.start || getTimestamp(30 * -count, 'm'),
          end: opts.end || getTimestamp(0, 'm'),
          granularity: 1800, // 30min
        },
      ),
    );
  }

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instId,
        start: opts.start || getTimestamp(1 * -count, 'h'),
        end: opts.end || getTimestamp(0, 'h'),
        granularity: 3600, // 1h
      },
    ),
  );

  if (instId.indexOf('BTC') !== -1) {
    reqOptions.push(
      Object.assign(
        {},
        {
          instrument_id: instId,
          start: opts.start || getTimestamp(2 * -count, 'h'),
          end: opts.end || getTimestamp(0, 'h'),
          granularity: 7200, // 2h
        },
      ),
    );
  }

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instId,
        start: opts.start || getTimestamp(4 * -count, 'h'),
        end: opts.end || getTimestamp(0, 'h'),
        granularity: 14400, // 4h
      },
    ),
  );

  if (instId.indexOf('BTC') !== -1) {
    reqOptions.push(
      Object.assign(
        {},
        {
          instrument_id: instId,
          start: opts.start || getTimestamp(6 * -count, 'h'),
          end: opts.end || getTimestamp(0, 'h'),
          granularity: 21600, // 6h
        },
      ),
    );

    reqOptions.push(
      Object.assign(
        {},
        {
          instrument_id: instId,
          start: opts.start || getTimestamp(12 * -count, 'h'),
          end: opts.end || getTimestamp(0, 'h'),
          granularity: 43200, // 12h
        },
      ),
    );
  }

  reqOptions.push(
    Object.assign(
      {},
      {
        instrument_id: instId,
        start: opts.start || getTimestamp(24 * -count, 'h'),
        end: opts.end || getTimestamp(0, 'h'),
        granularity: 86400, // 1d
      },
    ),
  );

  return await getKlinesWithLimited(
    reqOptions.map((opt: any) => {
      return Object.assign({}, opt, { exchange: opts.exchange });
    }),
  );
}

export { getKlinesWithLimited, getKlines };
