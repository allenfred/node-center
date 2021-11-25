import * as bluebird from 'bluebird';
import { BtcSwapCandle, SwapUSDTCandle } from '../database/models';
import { InstrumentCandleSchema } from '../types';
import logger from '../logger';

async function upsert(candles: InstrumentCandleSchema[]) {
  return bluebird.map(candles, async (candle: InstrumentCandleSchema) => {
    //find unique candle by underlying_index & timestamp & alias & granularity
    const uniqueCondition = {
      instrument_id: candle.instrument_id,
      timestamp: new Date(candle.timestamp),
      granularity: candle.granularity,
    };

    const Model = getModel(candle);

    const existedCandle = await Model.findOne(uniqueCondition);
    if (existedCandle) {
      return await Model.updateOne(uniqueCondition, candle).catch((err) => {
        logger.error(`update candle: ${candle}`, err);
      });
    } else {
      return await Model.create(candle).catch((err) => {
        logger.error(`create candle: ${candle}`, err);
      });
    }
  });
}

function getModel(candle) {
  if (candle.instrument_id.includes('BTC')) {
    return BtcSwapCandle;
  } else {
    return SwapUSDTCandle;
  }
}

const InstrumentCandleDao = {
  upsert,
};

export { InstrumentCandleDao };
