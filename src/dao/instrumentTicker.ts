import * as bluebird from 'bluebird';
import { InstrumentTicker } from '../database/models';
import { Ticker } from '../types';

async function upsert(tickers: Ticker[]): Promise<any> {
  return bluebird.map(tickers, async (ticker: Ticker) => {
    let result: any;
    const { instrument_id } = ticker;
    const one = await InstrumentTicker.findOne({
      instrument_id,
    });

    if (one) {
      result = await InstrumentTicker.updateOne({ instrument_id }, ticker);
    } else {
      result = await InstrumentTicker.create(ticker);
    }

    return result;
  });
}

const InstrumentTickerDao = {
  upsert,
};

export { InstrumentTickerDao };
