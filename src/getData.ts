import connectMongo from './database/connection';
import { InstrumentInfo } from './database/models';

(async function main() {
  //连接数据库
  await connectMongo();
  // await getMaxCandles('BTC-USD-SWAP');
  // await getMaxCandles('BTC-USDT-SWAP');
  // await getMaxCandlesWithGranularity('ETH-USDT-SWAP', 86400);
  // process.exit();
  // await BtcSwapCandle.remove({ granularity: 43100 });
  await InstrumentInfo.find({ exchange: 'biance' }).then((res) => {
    console.log(res);
  });
  await InstrumentInfo.updateMany(
    { exchange: 'biance' },
    { $set: { klines: 0 } },
    // { multi: true },
  ).then((res) => {
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
