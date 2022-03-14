import * as bluebird from 'bluebird';
import { InstrumentTicker } from '../database/models';
import { InstTicker } from '../types';
import logger from '../logger';

async function upsert(tickers: InstTicker[]): Promise<any> {
  return bluebird.map(
    tickers,
    async (ticker: InstTicker) => {
      let result: any;
      const { instrument_id, exchange } = ticker;
      const one = await InstrumentTicker.findOne({
        instrument_id,
        exchange,
      });

      try {
        if (one) {
          result = await InstrumentTicker.updateOne({ instrument_id, exchange }, ticker);
        } else {
          result = await InstrumentTicker.create(ticker);
        }
      } catch (e) {
        logger.error('upsertTicker catch error: ' + instrument_id);
      }

      return result;
    },
    { concurrency: 30 }
  );
}

const InstrumentTickerDao = {
  upsert,
};

export { InstrumentTickerDao };
