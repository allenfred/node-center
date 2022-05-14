import * as bluebird from 'bluebird';
import { BtcSwapKline, UsdtSwapKline } from '../database/models';
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
      const Model = getModel(kline.instrument_id);

      await Model.updateOne(uniqueCondition, kline, { upsert: true }).catch(
        (err: any) => {
          logger.error(
            `[UpdateKline:${kline.exchange}/${kline.instrument_id}/${
              kline.granularity
            }] CatchError: ${err.stack.substring(0, 100)}`,
          );
        },
      );
    },
    { concurrency: 5 },
  );
}

// for daily cron jobs
async function upsertMany(opts: any, klines: InstKline[]) {
  if (!klines.length) {
    return;
  }

  if (klines.length < 20) {
    return upsert(klines);
  }

  const Model = getModel(opts.instrument_id);
  const filter = Object.assign(opts, {
    timestamp: { $in: _.map(klines, 'timestamp') },
  });
  const data = await Model.find(filter, 'timestamp', {
    limit: klines.length,
    sort: { timestamp: 1 },
  }).exec();

  const filteredKlines = klines.filter((kline) => {
    const res = _.find(data, (o: any) => {
      return (
        new Date(o.timestamp).valueOf() === new Date(kline.timestamp).valueOf()
      );
    });
    return !res;
  });

  if (filteredKlines.length) {
    // return upsert(filteredKlines);
    return Model.insertMany(filteredKlines, { lean: true });
  } else {
    logger.info(
      `[${opts.instrument_id}/${klines[0].granularity}] 数据已经ready, 无需更新...`,
    );
  }
}

// for init jobs
async function reinsertMany(opts: any, klines: InstKline[]) {
  if (!klines.length) {
    return;
  }

  if (klines.length < 20) {
    return upsert(klines);
  }

  const Model = getModel(opts.instrument_id);
  const filter = Object.assign(opts, {
    timestamp: { $in: _.map(klines, 'timestamp') },
  });

  await Model.deleteMany(filter);
  return Model.insertMany(klines, { lean: true });
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
  const Model = getModel(kline.instrument_id);

  await Model.updateOne(uniqueCondition, kline, { upsert: true }).catch(
    (err: any) => {
      logger.error(`update kline `, err);
    },
  );
}

function getModel(instId: any) {
  if (instId.includes('BTC')) {
    return BtcSwapKline;
  } else {
    return UsdtSwapKline;
  }
}

const InstrumentKlineDao = {
  upsertOne,
  upsert,
  upsertMany,
  reinsertMany,
};

export { InstrumentKlineDao };
