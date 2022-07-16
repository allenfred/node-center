import * as bluebird from 'bluebird';
import { UsdtSwapKline } from '../database/models';
import { InstKline } from '../types';
import logger from '../logger';
import * as _ from 'lodash';

// for common update jobs
async function upsert(klines: InstKline[]) {
  return bluebird.map(
    klines,
    async (kline: InstKline) => {
      //find unique kline by underlying_index & timestamp & alias & granularity & exchange
      const uniqueCondition = {
        instrument_id: kline.instrument_id,
        timestamp: new Date(kline.timestamp),
        granularity: kline.granularity,
        exchange: kline.exchange,
      };

      await UsdtSwapKline.updateOne(uniqueCondition, kline, {
        upsert: true,
      }).catch((err: any) => {
        logger.error(
          `[UpdateKline:${kline.exchange}/${kline.instrument_id}/${
            kline.granularity
            // }] CatchError: ${err.stack.substring(0, 1000)}`,
          }] CatchError: ${err.message}`,
        );
      });
    },
    { concurrency: 1 },
  );
}

// for daily cron jobs
async function upsertMany(opts: any, klines: InstKline[]) {
  if (!klines.length) {
    return;
  }

  const filter = Object.assign(opts, {
    timestamp: { $in: _.map(klines, 'timestamp') },
  });

  const data = await UsdtSwapKline.find(
    filter,
    'timestamp open high low close',
    {
      limit: klines.length,
      sort: { timestamp: 1 },
    },
  ).exec();

  const insertNeeded = klines.filter((kline) => {
    const res = _.find(data, (o: any) => {
      return (
        new Date(o.timestamp).valueOf() === new Date(kline.timestamp).valueOf()
      );
    });
    return !res;
  });

  const updateNeeded = klines.filter((kline) => {
    const res = _.find(data, (o: any) => {
      return (
        new Date(o.timestamp).valueOf() ===
          new Date(kline.timestamp).valueOf() &&
        (kline.open !== o.open ||
          kline.high !== o.high ||
          kline.low !== o.low ||
          kline.close !== o.close)
      );
    });

    return !!res;
  });

  if (insertNeeded.length) {
    logger.info(
      `[${klines[0].exchange}/${opts.instrument_id}/${klines[0].granularity}] 新增K线 ${insertNeeded.length} 条.`,
    );

    await UsdtSwapKline.insertMany(insertNeeded, {
      ordered: false,
      lean: true,
    }).catch((err: any) => {
      logger.error(
        `[insertMany:${insertNeeded[0].exchange}/${insertNeeded[0].instrument_id}/${insertNeeded[0].granularity}] CatchError: ${err.message}`,
      );
    });
  }

  if (updateNeeded.length) {
    logger.info(
      `[${klines[0].exchange}/${opts.instrument_id}/${klines[0].granularity}] 更新K线 ${updateNeeded.length} 条.`,
    );
    await upsert(updateNeeded);
  }

  if (!insertNeeded.length && !updateNeeded.length) {
    logger.info(
      `[${klines[0].exchange}/${opts.instrument_id}/${klines[0].granularity}] 无需更新.`,
    );
  }
}

// for init jobs
async function reinsertMany(opts: any, klines: InstKline[]) {
  if (!klines.length) {
    return;
  }

  if (klines.length <= 30) {
    return upsert(klines);
  }

  const filter = Object.assign(opts, {
    timestamp: { $in: _.map(klines, 'timestamp') },
  });

  await UsdtSwapKline.deleteMany(filter);
  return UsdtSwapKline.insertMany(klines, { ordered: false, lean: true }).catch(
    (err: any) => {
      logger.error(err.message);
    },
  );
}

// for ws message jobs
async function upsertOne(kline: InstKline) {
  //find unique kline by underlying_index & timestamp & alias & granularity & exchange
  const uniqueCondition = {
    instrument_id: kline.instrument_id,
    timestamp: new Date(kline.timestamp),
    granularity: kline.granularity,
    exchange: kline.exchange,
  };

  await UsdtSwapKline.updateOne(uniqueCondition, kline, { upsert: true }).catch(
    (err: any) => {
      logger.error(`update kline `, err);
    },
  );
}

const InstrumentKlineDao = {
  upsertOne,
  upsert,
  upsertMany,
  reinsertMany,
};

export { InstrumentKlineDao };
