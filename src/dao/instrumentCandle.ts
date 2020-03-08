import * as bluebird from "bluebird";
import {
  InstrumentCandle,
  BtcSwapCandle,
  BtcFutureCandle,
  EthSwapCandle,
  EthFutureCandle,
  EosSwapCandle,
  EosFutureCandle,
  LtcSwapCandle,
  LtcFutureCandle,
  BchSwapCandle,
  BchFutureCandle,
  BsvSwapCandle,
  BsvFutureCandle
} from "../database/models";
import { InstrumentCandleSchema } from "../types";

async function upsert(candles: InstrumentCandleSchema[]) {
  return bluebird.map(candles, async (candle: InstrumentCandleSchema) => {
    //find unique candle by underlying_index & timestamp & alias & granularity
    const uniqueCondition = {
      timestamp: new Date(candle.timestamp),
      granularity: candle.granularity
    };

    const Model = getModel(candle);

    const existedCandle = await InstrumentCandle.findOne(uniqueCondition);

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
    LTC: LtcSwapCandle,
    EOS: EosSwapCandle,
    ETH: EthSwapCandle,
    BSV: BsvSwapCandle,
    BCH: BchSwapCandle
  };

  const futureModels = {
    BTC: BtcFutureCandle,
    LTC: LtcFutureCandle,
    EOS: EosFutureCandle,
    ETH: EthFutureCandle,
    BSV: BsvFutureCandle,
    BCH: BchFutureCandle
  };

  if (candle.instrument_id.includes("SWAP")) {
    return swapModels[candle.underlying_index];
  } else {
    return futureModels[candle.underlying_index];
  }
}

const InstrumentCandleDao = {
  upsert
};

export { InstrumentCandleDao };
