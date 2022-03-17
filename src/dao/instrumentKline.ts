import * as bluebird from 'bluebird';
import { BtcSwapKline, UsdtSwapKline } from '../database/models';
import { InstKline } from '../types';
import logger from '../logger';

async function upsert(klines: InstKline[]) {
  return bluebird.map(klines, async (kline: InstKline) => {
    //find unique kline by underlying_index & timestamp & alias & granularity & exchange
    const uniqueCondition = {
      instrument_id: kline.instrument_id,
      timestamp: new Date(kline.timestamp),
      granularity: kline.granularity,
      exchange: kline.exchange,
    };

    const Model = getModel(kline);
    const existedkline = await Model.findOne(uniqueCondition);

    if (existedkline) {
      await Model.updateOne(uniqueCondition, kline).catch((err: any) => {
        logger.error(
          `[UpdateKline:${kline.exchange}/${kline.instrument_id}/${
            kline.granularity
          }] CatchError: ${err.stack.substring(0, 100)}`,
        );
      });
    } else {
      await Model.create(kline)
        .then((res: any) => {
          logger.info(
            `[InsertKline:${kline.exchange}/${kline.instrument_id}/${kline.granularity}] success.`,
          );
        })
        .catch((err: any) => {
          logger.error(
            `[InsertKline:${kline.exchange}/${kline.instrument_id}/${
              kline.granularity
            }] CatchError: ${err.stack.substring(0, 100)}`,
          );
        });
    }
  });
}

async function update(klines: InstKline[]) {
  return bluebird.map(klines, async (kline: InstKline) => {
    //find unique kline by underlying_index & timestamp & alias & granularity & exchange
    const uniqueCondition = {
      instrument_id: kline.instrument_id,
      timestamp: new Date(kline.timestamp),
      granularity: kline.granularity,
      exchange: kline.exchange,
    };

    const Model = getModel(kline);
    const existedkline = await Model.findOne(uniqueCondition);

    if (existedkline) {
      await Model.updateOne(uniqueCondition, kline).catch((err: any) => {
        logger.error(`update kline `, err);
      });
    }
  });
}

function getModel(kline: any) {
  if (kline.instrument_id.includes('BTC')) {
    return BtcSwapKline;
  } else {
    return UsdtSwapKline;
  }
}

const InstrumentKlineDao = {
  upsert,
  update,
};

export { InstrumentKlineDao };
