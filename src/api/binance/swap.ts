import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import logger from '../../logger';
import { Exchange, Instrument, HistoryKlinesJobsOpts } from '../../types';
import { InstrumentInfoDao, InstrumentKlineDao } from '../../dao';
import { InstrumentInfo } from '../../database/models';
import { getInstruments } from './client';
import { getBinanceKlines } from '../common';
import { getTimestamp } from '../../util';

export async function initInstruments(): Promise<Instrument[]> {
  //获取全量永续合约信息
  let instruments: Array<Instrument> = await getInstruments();

  // BTC合约及其他USDT本位合约
  instruments = instruments.filter((i) => i.instrument_id.endsWith('USDT'));
  logger.info(
    `Binance[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`,
  );

  if (!instruments.length) {
    return [];
  }

  // ****** 处理下架合约 ******
  const oldInsts: Instrument[] = await InstrumentInfoDao.find({
    exchange: Exchange.Binance,
  });

  const invalidInsts = _.differenceBy(oldInsts, instruments, 'instrument_id');

  if (invalidInsts.length) {
    logger.info(_.map(invalidInsts, 'instrument_id'));

    await InstrumentInfoDao.deleteByIds(
      _.map(invalidInsts, 'instrument_id'),
      Exchange.Binance,
    ).then((result: any) => {
      if (result.ok === 1) {
        logger.info(
          `Binance[永续合约] - 删除下架合约，共: ${result.deletedCount} 条 ...`,
        );
      }
    });
  }
  // ********************

  //更新永续合约信息
  await InstrumentInfoDao.upsert(instruments);
  let data: Instrument[] = await InstrumentInfoDao.find({
    exchange: Exchange.Binance,
  });

  logger.info(`Binance[永续合约] - 待初始化K线的合约数量 ${data.length} ...`);

  return _.sortBy(data, ['instrument_id']);
}

// 获取最近100条k线数据 (15min 30min 1h 2h 4h 6h 12h 1d)
// For BTC (15min 30min 1h 2h 4h 6h 12h 1d)
// For Others (15min 1h 4h 1d)
function getReqOptions(instId: string, opts: HistoryKlinesJobsOpts = {}) {
  let reqOptions = [];
  let count = 1500;

  if (opts && opts.count > 0) {
    count = opts.count;
  }

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

    reqOptions.push(
      Object.assign(
        {},
        {
          instrument_id: instId,
          start: opts.start || getTimestamp(12 * 2 * 7 * -count, 'h'),
          end: opts.end || getTimestamp(0, 'h'),
          granularity: 604800, // 1w
        },
      ),
    );
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
  let opts = options || {};
  if (!opts.count) {
    opts = Object.assign({}, opts, { count: 1500 });
  }

  const delayMillseconds = opts && opts.delay ? opts.delay : 100;

  return bluebird.each(instruments, ({ instrument_id }: any) => {
    //设置系统限速规则 (binance官方API 限速规则：2400次/60s)
    return bluebird
      .delay(delayMillseconds)
      .then(() => {
        return getBinanceKlines(
          getReqOptions(instrument_id, opts).map((opt: any) => {
            return Object.assign({}, opt, { exchange: Exchange.Binance });
          }),
          options.updateFunc || InstrumentKlineDao.upsertMany,
        );
      })
      .then(() => {
        return InstrumentInfo.updateOne(
          { exchange: Exchange.Binance, instrument_id },
          { klines: 1 },
        ).catch((e: any) => {
          logger.error('InstrumentInfo updateOne ' + e.message);
        });
      })
      .then(() => {
        return;
      });
  });
}