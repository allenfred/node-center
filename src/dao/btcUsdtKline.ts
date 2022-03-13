import * as bluebird from 'bluebird';
import { btcUsdtKline } from '../database/models';
import { InstKline } from '../types';

async function upsert(candles: InstKline[]) {
  return bluebird.map(candles, async (kline: InstKline) => {
    //find unique candle by underlying_index & timestamp & alias & granularity
    const uniqueCondition = {
      timestamp: new Date(kline.timestamp),
      granularity: kline.granularity,
    };
    const existedCandle = await btcUsdtKline.findOne(uniqueCondition);

    if (existedCandle) {
      return await btcUsdtKline.updateOne(uniqueCondition, kline);
    } else {
      return await btcUsdtKline.create(kline);
    }
  });
}

const BtcUsdtKlineDao = {
  upsert,
};

export { BtcUsdtKlineDao };
