import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import logger from '../../logger';
import {
  Exchange,
  Instrument,
  KlineReqOpts,
  HistoryKlinesJobsOpts,
} from '../../types';
import { InstrumentInfoDao } from '../../dao';
import { InstrumentInfo } from '../../database/models';
import { getInstruments } from './client';
import { getOkexKlines } from './../common';
import { getTimestamp } from '../../util';

export async function initInstruments(): Promise<Instrument[]> {
  //获取全量永续合约信息
  let instruments: Array<Instrument> = await getInstruments();

  // BTC合约及其他USDT本位合约
  instruments = instruments.filter((i) =>
    i.instrument_id.endsWith('USDT-SWAP'),
  );
  logger.info(
    `Okx[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`,
  );

  if (!instruments.length) {
    return;
  }

  // ****** 处理下架合约 ******
  const oldInsts: any = await InstrumentInfoDao.find({
    exchange: Exchange.Okex,
  });

  const invalidInsts = _.differenceBy(oldInsts, instruments, 'instrument_id');

  if (invalidInsts.length) {
    logger.info(_.map(invalidInsts, 'instrument_id'));

    await InstrumentInfoDao.deleteByIds(
      _.map(invalidInsts, 'instrument_id'),
      Exchange.Okex,
    ).then((result: any) => {
      if (result.ok === 1) {
        logger.info(
          `Okx[永续合约] - 删除下架合约，共: ${result.deletedCount} 条 ...`,
        );
      }
    });
  }
  // *************************

  //更新永续合约信息
  await InstrumentInfoDao.upsert(
    instruments.map((i: any) => {
      return Object.assign(i, { tick_size: +i.tick_size }) as any;
    }),
  );
  let data: any = await InstrumentInfoDao.find({ exchange: Exchange.Okex });
  // data = data.filter((i: Instrument) => i.klines !== 1);

  logger.info(`Okex[永续合约] - 待初始化K线的合约数量 ${data.length} ...`);

  return _.sortBy(data, ['instrument_id']);
}

// 获取最多过去 1500 条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
function getReqOptions(
  instId: string,
  opts: HistoryKlinesJobsOpts = {},
): KlineReqOpts[] {
  const instrumentId = instId;
  const count = opts.count || 300;
  let reqOptions = [];

  for (let i = 0; i < 1; i++) {
    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 15 * -count, 'm'),
      end: getTimestamp(i * 15 * -count, 'm'),
      granularity: 900, // 15m
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * -count, 'h'),
      end: getTimestamp(i * -count, 'h'),
      granularity: 3600, // 1h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 4 * -count, 'h'),
      end: getTimestamp(i * 4 * -count, 'h'),
      granularity: 14400, // 4h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 24 * -count, 'h'),
      end: getTimestamp(i * 24 * -count, 'h'),
      granularity: 86400, // 1d
    });

    if (instrumentId.indexOf('BTC') !== -1) {
      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 30 * -count, 'm'),
        end: getTimestamp(i * 30 * -count, 'm'),
        granularity: 1800, // 30m
      });

      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 2 * -count, 'h'),
        end: getTimestamp(i * 2 * -count, 'h'),
        granularity: 7200, // 2h
      });

      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 6 * -count, 'h'),
        end: getTimestamp(i * 6 * -count, 'h'),
        granularity: 21600, // 6h
      });

      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 12 * -count, 'h'),
        end: getTimestamp(i * 12 * -count, 'h'),
        granularity: 43200, // 12h
      });
    }
  }

  if (opts && opts.includeInterval && opts.includeInterval.length) {
    reqOptions = reqOptions.filter((i) =>
      opts.includeInterval.includes(i.granularity),
    );
  }

  if (opts && opts.includeInst && opts.includeInst.length) {
    reqOptions = reqOptions.filter((i) =>
      opts.includeInst.includes(i.instrument_id),
    );
  }

  return reqOptions;
}

export async function getHistoryKlines(
  instruments: Instrument[],
  options?: HistoryKlinesJobsOpts,
): Promise<void> {
  //获取所有时间粒度请求参数 如[60/180/300 900/1800/3600/7200/14400/21600/43200/86400]
  let opts = options || {};
  if (!opts.count) {
    opts = Object.assign(opts, { count: 300 });
  }

  return bluebird.each(instruments, ({ instrument_id }: any) => {
    return bluebird
      .delay(500)
      .then(() => {
        return getOkexKlines(
          getReqOptions(instrument_id, opts).map((opt: any) => {
            return Object.assign({}, opt, { exchange: Exchange.Okex });
          }),
        );
      })
      .then(() => {
        return InstrumentInfo.updateOne(
          { exchange: Exchange.Okex, instrument_id },
          { klines: 1 },
        );
      })
      .then(() => {
        return;
      });
  });
}
