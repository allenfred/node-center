import * as bluebird from 'bluebird';
import { BtcSwapKline, UsdtSwapKline } from '../database/models';
import { InstKline } from '../types';
import logger from '../logger';

async function upsert(klines: InstKline[]) {
  return bluebird.map(klines, async (kline: InstKline) => {
    if (kline.instrument_id.indexOf('SWAP') === -1) {
      return;
    }
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
    } else {
      await Model.create(kline)
        // .then((res: any) => {
        //   logger.info(`Create Kline ${kline.exchange}/${kline.instrument_id} ${kline.granularity}`);
        // })
        .catch((err: any) => {
          logger.error(`create kline catch Eror: `, err);
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
};

export { InstrumentKlineDao };
