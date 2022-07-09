import connectMongo from './database/connection';
import { InstrumentInfo, UsdtSwapKline } from './database/models';
import * as _ from 'lodash';

(async function main() {
  //连接数据库
  await connectMongo();
  // await getMaxCandles('BTC-USD-SWAP');
  // await getMaxCandles('BTC-USDT-SWAP');
  // await getMaxCandlesWithGranularity('ETH-USDT-SWAP', 86400);
  // process.exit();
  // await BtcSwapCandle.remove({ granularity: 43100 });
  // await InstrumentInfo.find({ exchange: 'biance' }).then((res) => {
  //   console.log(res);
  // });

  await InstrumentInfo.updateMany(
    {},
    { $set: { klines: 0 } },
    // { multi: true },
  ).then((res) => {
    console.log(res);
  });

  // let flag = true;
  // const limit = 1000;
  // while (flag) {
  //   const klines = await BtcSwapKline.find(
  //     {},
  //     '_id instrument_id timestamp open high low close volume exchange granularity underlying_index',
  //     {
  //       limit,
  //       sort: { timestamp: -1 },
  //     },
  //   ).exec();

  //   if (klines.length < limit) {
  //     flag = false;
  //   }

  //   await UsdtSwapKline.insertMany(
  //     klines.map((k) => {
  //       return _.omit(k, ['_id']);
  //     }),
  //   ).then((res) => {
  //     if (res.length !== klines.length) {
  //       flag = false;
  //       console.log('insertMany wrong!!!');
  //     } else {
  //       console.log('insertMany success!!!');
  //     }
  //   });

  //   await BtcSwapKline.deleteMany({
  //     _id: { $in: _.map(klines, '_id') },
  //   }).then((res) => {
  //     if (res.deletedCount !== klines.length) {
  //       console.log('deleteMany wrong!!!');
  //       flag = false;
  //     } else {
  //       console.log('deleteMany success!!!');
  //     }
  //   });
  // }

  // const klines = await BtcSwapKline.find(
  //   { instrument_id: 'BTC-USDT-SWAP' },
  //   'instrument_id timestamp granularity',
  //   {
  //     limit: 1000,
  //     sort: { timestamp: -1 },
  //   },
  // ).exec();
  // console.log(klines);
  await UsdtSwapKline.deleteMany({
    exchange: 'bybit',
    // instrument_id: 'KNCUSDT',
  }).then((res) => {
    console.log(res);
  });

  process.exit();
  // await InstrumentInfo.aggregate([
  //   {
  //     $match: {
  //       underlying_index: 'BTC',
  //       alias: { $in: ['swap'] },
  //       // alias: { $in: ["this_week", "next_week", "quarter"] },
  //     },
  //   },
  //   { $out: 'btc_swap_candles' },
  // ])
  //   .then((res) => {
  //     console.log(res);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
})();
