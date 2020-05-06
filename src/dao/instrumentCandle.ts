import * as bluebird from "bluebird";
import {
  BtcSwapCandle,
  BtcFutureCandle,
  EthSwapCandle,
  EthFutureCandle,
  EosSwapCandle,
  EosFutureCandle,
} from "../database/models";
import { InstrumentCandleSchema } from "../types";

async function upsert(candles: InstrumentCandleSchema[]) {
  return bluebird.map(candles, async (candle: InstrumentCandleSchema) => {
    //find unique candle by underlying_index & timestamp & alias & granularity
    const uniqueCondition = {
      timestamp: new Date(candle.timestamp),
      granularity: candle.granularity,
    };

    const Model = getModel(candle);

    const existedCandle = await Model.findOne(uniqueCondition);

    if (existedCandle) {
      return await Model.updateOne(uniqueCondition, candle);
    } else {
      return await Model.create(candle);
    }
  });
}

function getModel(candle) {
  const swapModels = {
    BTC: BtcSwapCandle,
    EOS: EosSwapCandle,
    ETH: EthSwapCandle,
  };

  const futureModels = {
    BTC: BtcFutureCandle,
    EOS: EosFutureCandle,
    ETH: EthFutureCandle,
  };

  if (candle.instrument_id.includes("SWAP")) {
    return swapModels[candle.underlying_index];
  } else {
    return futureModels[candle.underlying_index];
  }
}

const InstrumentCandleDao = {
  upsert,
};

export { InstrumentCandleDao };
