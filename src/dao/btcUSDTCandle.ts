import * as bluebird from "bluebird";
import { btcUSDTCandle } from "../database/models";
import { InstrumentCandleSchema } from "../types";

async function upsert(candles: InstrumentCandleSchema[]) {
  return bluebird.map(candles, async (candle: InstrumentCandleSchema) => {
    //find unique candle by underlying_index & timestamp & alias & granularity
    const uniqueCondition = {
      timestamp: new Date(candle.timestamp),
      granularity: candle.granularity
    };
    const existedCandle = await btcUSDTCandle.findOne(uniqueCondition);

    if (existedCandle) {
      return await btcUSDTCandle.updateOne(uniqueCondition, candle);
    } else {
      return await btcUSDTCandle.create(candle);
    }
  });
}

const BtcUSDTCandleDao = {
  upsert
};

export { BtcUSDTCandleDao };
