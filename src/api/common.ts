import * as bluebird from 'bluebird';
import {
  Exchange,
  Instrument,
  OkxKline,
  BianceKline,
  InstReqOptions,
  BianceKlineApiOpts,
  KlineInterval,
} from '../types';
import { InstrumentKlineDao } from '../dao';
import { getTimestamp, getMemoryUsage, sleep, wait } from '../util';
import * as Biance from './biance/client';
import * as Okex from './okex/client';
import * as Bybit from './bybit/client';
import logger from '../logger';
import { BybitKline } from '../types/bybit';

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

const BybitKlineInterval = {
  300: '5',
  900: '15',
  1800: '30',
  3600: '60',
  7200: '120',
  14400: '240',
  21600: '360',
  43200: '720',
  86400: 'D',
  604800: 'W',
};

async function getKlinesWithLimited(
  options: Array<InstReqOptions>,
  updateOperate: any = InstrumentKlineDao.upsertMany,
): Promise<any> {
  //设置系统限速规则 (biance官方API 限速规则：2400次/60s)
  //设置系统限速规则 (Okex官方API 限速规则：20次/2s)

  return bluebird.map(
    options,
    async (option: any) => {
      const { exchange, instrument_id, granularity } = option;
      Promise.resolve()
        .then(() => {
          if (exchange === Exchange.Biance) {
            return Biance.getKlines({
              symbol: option.instrument_id,
              interval: BianceKlineInterval[option.granularity],
              startTime: new Date(option.start).valueOf(),
              endTime: new Date(option.end).valueOf(),
              limit: 1500,
            });
          } else if (exchange === Exchange.Okex) {
            return Okex.getKlines({
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
                underlying_index: option.instrument_id.endsWith('USDT')
                  ? option.instrument_id.replace('USDT', '')
                  : option.instrument_id.split('-')[0],
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

          return updateOperate(
            {
              exchange,
              instrument_id: instrument_id,
              granularity: granularity,
            },
            klines,
          );
        })
        .then(() => {
          logger.info(
            `[${exchange}/${exchange}/${
              KlineInterval[+granularity]
            }] K线 Done.`,
          );
          return Promise.resolve();
        })
        .catch((err) => {
          logger.error(err);
        });
    },
    { concurrency: 5 },
  );
}

async function getBianceKlines(
  options: Array<InstReqOptions>,
  updateOperate: any = InstrumentKlineDao.upsertMany,
): Promise<any> {
  //设置系统限速规则 (biance官方API 限速规则：2400次/60s)

  return bluebird.map(
    options,
    async (option: any) => {
      const { exchange, instrument_id, granularity } = option;
      return Biance.getKlines({
        symbol: instrument_id,
        interval: BianceKlineInterval[granularity],
        startTime: new Date(option.start).valueOf(),
        endTime: new Date(option.end).valueOf(),
        limit: 1500,
      })
        .then((data: Array<any>) => {
          let klines = [];
          klines = data.map((candle: BianceKline) => {
            return {
              instrument_id,
              underlying_index: instrument_id.replace('USDT', ''),
              quote_currency: 'USDT',
              timestamp: new Date(+candle[0]),
              open: +candle[1],
              high: +candle[2],
              low: +candle[3],
              close: +candle[4],
              volume: +candle[5],
              currency_volume: +candle[6],
              granularity,
              exchange,
            };
          });

          return updateOperate(
            {
              exchange,
              instrument_id,
              granularity,
            },
            klines,
          );
        })
        .then(() => {
          // logger.info(
          //   `[Biance/${instrument_id}/${
          //     KlineInterval[+granularity]
          //   }] K线 Done.`,
          // );
          return Promise.resolve();
        });
    },
    { concurrency: 2 },
  );
}

async function getBybitKlines(
  options: Array<InstReqOptions>,
  updateOperate: any = InstrumentKlineDao.upsertMany,
): Promise<any> {
  //设置系统限速规则 (bybit官方API 限速规则：20次/s)

  return bluebird.map(
    options,
    async (option: any) => {
      const { exchange, instrument_id, granularity } = option;
      return Bybit.getKlines({
        symbol: instrument_id,
        interval: BybitKlineInterval[granularity],
        from: Math.round(new Date(option.start).valueOf() / 1000), // 秒
        limit: 200, // default
      })
        .then((data: Array<any>) => {
          let klines = [];
          klines = data.map((kline: BybitKline) => {
            return {
              instrument_id,
              underlying_index: instrument_id.replace('USDT', ''),
              timestamp: new Date(+kline.start_at * 1000),
              open: kline.open,
              high: kline.high,
              low: kline.low,
              close: kline.close,
              volume: kline.volume,
              currency_volume: kline.turnover, // 成交额 USD
              granularity,
              exchange,
            };
          });

          return updateOperate(
            {
              exchange,
              instrument_id,
              granularity,
            },
            klines,
          );
        })
        .then(() => {
          // logger.info(
          //   `[Bybit/${instrument_id}/${KlineInterval[+granularity]}] K线 Done.`,
          // );
          return Promise.resolve();
        });
    },
    { concurrency: 3 },
  );
}

async function getOkexKlines(
  options: Array<InstReqOptions>,
  updateOperate: any = InstrumentKlineDao.upsertMany,
): Promise<any> {
  //设置系统限速规则 (Okex官方API 限速规则：20次/2s)

  return bluebird.map(
    options,
    async (option: any) => {
      const { exchange, instrument_id, granularity } = option;
      return Okex.getKlines({
        instrumentId: instrument_id,
        granularity,
        start: new Date(option.start).valueOf(),
        end: new Date(option.end).valueOf(),
      })
        .then((data: Array<any>) => {
          let klines = [];
          klines = data.map((candle: OkxKline) => {
            return {
              instrument_id,
              underlying_index: instrument_id.split('-')[0],
              quote_currency: 'USDT',
              timestamp: new Date(+candle[0]),
              open: +candle[1],
              high: +candle[2],
              low: +candle[3],
              close: +candle[4],
              volume: +candle[5],
              currency_volume: +candle[6],
              granularity,
              exchange,
            };
          });

          return updateOperate(
            {
              exchange,
              instrument_id,
              granularity,
            },
            klines,
          );
        })
        .then(() => {
          // logger.info(
          //   `[Okex/${instrument_id}/${KlineInterval[+granularity]}] K线 Done.`,
          // );
          return Promise.resolve();
        });
    },
    { concurrency: 5 },
  );
}

function getKlinesReqParams(opts: {
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

  const { instId, exchange } = opts;

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

  if (instId.indexOf('BTC') !== -1) {
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

  return reqOptions.map((opt) => {
    return Object.assign(opt, { exchange });
  });
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
  return await getKlinesWithLimited(
    getKlinesReqParams(opts).map((opt: any) => {
      return Object.assign({}, opt, { exchange: opts.exchange });
    }),
  );
}

export {
  getKlinesWithLimited,
  getKlines,
  getBianceKlines,
  getOkexKlines,
  getBybitKlines,
  getKlinesReqParams,
};
