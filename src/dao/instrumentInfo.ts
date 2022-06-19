import * as bluebird from 'bluebird';
import { InstrumentInfo } from '../database/models';
import { Instrument } from '../types';

async function upsert(instruments: Instrument[]): Promise<any> {
  return bluebird.map(instruments, async (item: Instrument) => {
    //find unique candle by underlying_index & quote_currency & alias.
    const uniqueCondition = {
      instrument_id: item.instrument_id,
      exchange: item.exchange,
    };

    return InstrumentInfo.updateOne(uniqueCondition, item, { upsert: true });
  });
}

async function find(opts?: any): Promise<any> {
  return await InstrumentInfo.find(opts);
}

async function findByTopVolume(opts: any) {
  return await InstrumentInfo.find({ exchange: opts.exchange }, null, {
    limit: opts.limit || 30,
    sort: { volume_24h: -1 },
  }).exec();
}

async function deleteByIds(instIds: string[], exchange: string) {
  return await InstrumentInfo.deleteMany({
    exchange,
    instrument_id: { $in: instIds },
  });
}

const InstrumentInfoDao = {
  upsert,
  find,
  deleteByIds,
  findByTopVolume,
};

export { InstrumentInfoDao };
