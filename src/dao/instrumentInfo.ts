import * as bluebird from 'bluebird';
import { InstrumentInfo } from '../database/models';
import { Instrument } from '../types';

async function upsert(instruments: Instrument[]): Promise<any> {
  return bluebird.map(instruments, async (item: Instrument) => {
    //find unique candle by underlying_index & quote_currency & alias.
    const uniqueCondition = {
      underlying_index: item.underlying_index,
      quote_currency: item.quote_currency,
      alias: item.alias,
    };
    let result: any;

    const one = await InstrumentInfo.findOne(uniqueCondition);
    if (one) {
      result = await InstrumentInfo.updateOne(uniqueCondition, item);
    } else {
      result = await InstrumentInfo.create(item);
    }

    return result;
  });
}

const InstrumentInfoDao = {
  upsert,
};

export { InstrumentInfoDao };
