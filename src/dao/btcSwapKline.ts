import * as bluebird from 'bluebird';
import { BtcSwapKline } from '../database/models';
import { InstKline } from '../types';

async function upsert(candles: InstKline[]) {
  return bluebird.map(candles, async (candle: InstKline) => {
    //find unique candle by underlying_index & timestamp & alias & granularity
    const uniqueCondition = {
      instrument_id: candle.instrument_id,
      timestamp: new Date(candle.timestamp),
      granularity: candle.granularity,
    };

    const existedCandle = await BtcSwapKline.findOne(uniqueCondition);

    if (existedCandle) {
      return await BtcSwapKline.updateOne(uniqueCondition, candle);
    } else {
      return await BtcSwapKline.create(candle);
    }
  });
}

const BtcSwapKlineDao = {
  upsert,
};

export { BtcSwapKlineDao };
