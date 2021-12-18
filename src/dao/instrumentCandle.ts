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
      await Model.updateOne(uniqueCondition, candle).catch((err: any) => {
        logger.error(`update candle `, err);
      });
    } else {
      await Model.create(candle)
        .then((res: any) => {
          logger.info(`Create ${candle.instrument_id} ${candle.granularity}`);
        })
        .catch((err) => {
          logger.error(`create candle `, err);
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
