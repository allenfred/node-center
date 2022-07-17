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

async function findAll() {
  // 获取所有合约信息
  const insts: Instrument[] = await InstrumentInfo.aggregate([
    { $sort: { exchange: 1 } },
    {
      $group: {
        _id: '$base_currency',
        base_currency: { $first: '$base_currency' },
        quote_currency: { $first: '$quote_currency' },
        exchange: { $first: '$exchange' },
        volume_24h: { $first: '$volume_24h' },
        instrument_id: { $first: '$instrument_id' },
      },
    },
    { $sort: { volume_24h: -1 } },
    {
      $project: {
        instrument_id: '$instrument_id',
        base_currency: '$base_currency',
        quote_currency: '$quote_currency',
        exchange: '$exchange',
        volume_24h: '$volume_24h',
      },
    },
  ]);

  return insts;
}

const InstrumentInfoDao = {
  upsert,
  find,
  deleteByIds,
  findByTopVolume,
  findAll,
};

export { InstrumentInfoDao };
