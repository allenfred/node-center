import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import logger from '../../logger';
import {
  Exchange,
  Instrument,
  HistoryKlinesJobsOpts,
  KlineReqOpts,
} from '../../types';
import { InstrumentInfoDao, InstrumentKlineDao } from '../../dao';
import { InstrumentInfo } from '../../database/models';
import { getInstruments } from './client';
import { getBybitKlines } from '../common';
import { getTimestamp } from '../../util';

export async function initInstruments(): Promise<Instrument[]> {
  //获取全量永续合约信息
  let instruments: Array<Instrument> = await getInstruments();

  // BTC合约及其他USDT本位合约
  instruments = instruments.filter((i) => i.instrument_id.endsWith('USDT'));
  logger.info(
    `Bybit[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`,
  );

  if (!instruments.length) {
    return;
  }

  // ****** 处理下架合约 ******
  const oldInsts: any = await InstrumentInfoDao.find({
    exchange: Exchange.Bybit,
  });

  const invalidInsts = _.differenceBy(oldInsts, instruments, 'instrument_id');

  if (invalidInsts.length) {
    logger.info(_.map(invalidInsts, 'instrument_id'));

    await InstrumentInfoDao.deleteByIds(
      _.map(invalidInsts, 'instrument_id'),
      Exchange.Bybit,
    ).then((result: any) => {
      if (result.ok === 1) {
        logger.info(
          `Bybit[永续合约] - 删除下架合约，共: ${result.deletedCount} 条 ...`,
        );
      }
    });
  }
  // ********************

  //更新永续合约信息
  await InstrumentInfoDao.upsert(instruments);
  let data: any = await InstrumentInfoDao.find({ exchange: Exchange.Bybit });
  data = data.filter((i: Instrument) => i.klines !== 1);

  logger.info(`Bybit[永续合约] - 待初始化K线的合约数量 ${data.length} ...`);

  return _.sortBy(data, ['instrument_id']);
}

// 获取最多过去 1500 条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
function getReqOptions(
  instId: string,
  opts: HistoryKlinesJobsOpts = {},
): KlineReqOpts[] {
  const instrumentId = instId;
  const count = opts.count || 200;
  let reqOptions = [];

  const times = count % 200 === 0 ? count / 200 : Math.round(count / 200) + 1;

  for (let i = 0; i < times; i++) {
    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 15 * -200, 'm'),
      end: getTimestamp(i * 15 * -200, 'm'),
      granularity: 900, // 15m
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * -200, 'h'),
      end: getTimestamp(i * -200, 'h'),
      granularity: 3600, // 1h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 4 * -200, 'h'),
      end: getTimestamp(i * 4 * -200, 'h'),
      granularity: 14400, // 4h
    });

    reqOptions.push({
      instrument_id: instrumentId,
      start: getTimestamp((i + 1) * 24 * -200, 'h'),
      end: getTimestamp(i * 24 * -200, 'h'),
      granularity: 86400, // 1d
    });

    if (instrumentId.indexOf('BTC') !== -1) {
      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 30 * -200, 'm'),
        end: getTimestamp(i * 30 * -200, 'm'),
        granularity: 1800, // 30m
      });

      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 2 * -200, 'h'),
        end: getTimestamp(i * 2 * -200, 'h'),
        granularity: 7200, // 2h
      });

      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 6 * -200, 'h'),
        end: getTimestamp(i * 6 * -200, 'h'),
        granularity: 21600, // 6h
      });

      reqOptions.push({
        instrument_id: instrumentId,
        start: getTimestamp((i + 1) * 12 * -200, 'h'),
        end: getTimestamp(i * 12 * -200, 'h'),
        granularity: 43200, // 12h
      });
    }
  }

  if (opts && opts.includeInterval && opts.includeInterval.length) {
    reqOptions = reqOptions.filter((i) =>
      opts.includeInterval.includes(i.granularity),
    );
  }

  return reqOptions;
}

export async function getHistoryKlines(
  instruments: Instrument[],
  options?: HistoryKlinesJobsOpts,
): Promise<void> {
  let opts = options || {};
  if (!opts.count) {
    opts = Object.assign({}, opts, { count: 1000 });
  }

  const delayMillseconds = opts && opts.delay ? opts.delay : 100;

  return bluebird.each(instruments, ({ instrument_id }: any) => {
    //设置系统限速规则 (bybit官方API 限速规则：20次/s)
    return bluebird
      .delay(delayMillseconds)
      .then(() => {
        return getBybitKlines(
          getReqOptions(instrument_id, opts).map((opt: any) => {
            return Object.assign({}, opt, { exchange: Exchange.Bybit });
          }),
          InstrumentKlineDao.reinsertMany,
        );
      })
      .then(() => {
        return InstrumentInfo.updateOne(
          { exchange: Exchange.Bybit, instrument_id },
          { klines: 1 },
        );
      })
      .then(() => {
        return;
      });
  });
}
