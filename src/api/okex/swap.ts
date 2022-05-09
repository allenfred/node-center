import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import logger from '../../logger';
import { Exchange, Instrument, KlineReqOpts } from '../../types';
import { InstrumentInfoDao } from '../../dao';
import { getOkxSwapInsts } from './client';
import { getKlines, getKlinesWithLimited } from './../common';
import { getTimestamp } from '../../util';

export async function initOkxInsts(): Promise<Instrument[]> {
  //获取全量永续合约信息
  let instruments: Array<Instrument> = await getOkxSwapInsts();

  // BTC合约及其他USDT本位合约
  instruments = instruments.filter((i) =>
    i.instrument_id.endsWith('USDT-SWAP'),
  );
  logger.info(
    `Okx[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`,
  );

  //更新永续合约信息
  await InstrumentInfoDao.upsert(
    instruments.map((i: any) => {
      return Object.assign(i, { tick_size: +i.tick_size }) as any;
    }),
  );
  logger.info(`Okx[永续合约] - 公共合约全量信息更新数据库成功 ...`);

  return _.sortBy(instruments, ['instrument_id']);
}

// 获取最多过去 1500 条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
function getReqOptions(instrumentId: string): KlineReqOpts[] {
  const reqOptions = [];
  for (let i = 0; i < 5; i++) {
    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 15 * -300, 'm'),
      end: getTimestamp(i * 15 * -300, 'm'),
      granularity: 900, // 15m
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * -300, 'h'),
      end: getTimestamp(i * -300, 'h'),
      granularity: 3600, // 1h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 4 * -300, 'h'),
      end: getTimestamp(i * 4 * -300, 'h'),
      granularity: 14400, // 4h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 24 * -300, 'h'),
      end: getTimestamp(i * 24 * -300, 'h'),
      granularity: 86400, // 1d
    });

    if (instrumentId.indexOf('BTC') !== -1) {
      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 30 * -300, 'm'),
        end: getTimestamp(i * 30 * -300, 'm'),
        granularity: 1800, // 30m
      });

      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 2 * -300, 'h'),
        end: getTimestamp(i * 2 * -300, 'h'),
        granularity: 7200, // 2h
      });

      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 6 * -300, 'h'),
        end: getTimestamp(i * 6 * -300, 'h'),
        granularity: 21600, // 6h
      });

      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 12 * -300, 'h'),
        end: getTimestamp(i * 12 * -300, 'h'),
        granularity: 43200, // 12h
      });
    }
  }

  return reqOptions;
}

export async function getOkxHistoryKlines(
  instruments: Instrument[],
  opts?: { days?: number; start?: number; end?: number },
): Promise<void> {
  //获取所有时间粒度请求参数 如[60/180/300 900/1800/3600/7200/14400/21600/43200/86400]

  let reqOpts: KlineReqOpts[] = [];

  instruments.map((inst) => {
    reqOpts = reqOpts.concat(getReqOptions(inst.instrument_id));
  });

  return bluebird.map(
    reqOpts,
    async (opt: KlineReqOpts) => {
      return await getKlinesWithLimited(
        reqOpts.map((opt: any) => {
          return Object.assign({}, opt, { exchange: Exchange.Okex });
        }),
      );

      // return await getKlines({
      //   exchange: Exchange.Okex,
      //   instId: opt.instrumentId,
      //   count: 100, // Okx K线接口 最大为100
      //   start: opt.start,
      //   end: opt.end,
      // });
    },
    { concurrency: 5 },
  );
}
