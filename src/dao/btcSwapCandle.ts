import * as bluebird from "bluebird";
import { InstrumentCandle } from "../database/models";
import { InstrumentCandleSchema } from "../types";
import { getInstrumentAlias } from "../util";

async function upsert(candles: InstrumentCandleSchema[]) {
  return bluebird.map(candles, async (candle: InstrumentCandleSchema) => {
    //find unique candle by underlying_index & timestamp & alias & granularity
    const uniqueCondition = {
      timestamp: new Date(candle.timestamp),
      granularity: candle.granularity
    };
    const existedCandle = await InstrumentCandle.findOne(uniqueCondition);

    if (existedCandle) {
      return await InstrumentCandle.updateOne(uniqueCondition, candle);
    } else {
      return await InstrumentCandle.create(candle);
    }
  });
}

const InstrumentCandleDao = {
  upsert
};

export { InstrumentCandleDao };
