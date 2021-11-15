import * as bluebird from 'bluebird';
import { BtcSwapCandle } from '../database/models';
import { InstrumentCandleSchema } from '../types';

async function upsert(candles: InstrumentCandleSchema[]) {
  return bluebird.map(candles, async (candle: InstrumentCandleSchema) => {
    //find unique candle by underlying_index & timestamp & alias & granularity
    const uniqueCondition = {
      instrument_id: candle.instrument_id,
      timestamp: new Date(candle.timestamp),
      granularity: candle.granularity,
    };

    const existedCandle = await BtcSwapCandle.findOne(uniqueCondition);

    if (existedCandle) {
      return await BtcSwapCandle.updateOne(uniqueCondition, candle);
    } else {
      return await BtcSwapCandle.create(candle);
    }
  });
}

const BtcSwapCandleDao = {
  upsert,
};

export { BtcSwapCandleDao };
