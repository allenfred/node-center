import connectMongo from './database/connection';
import { SwapUSDTCandle, BtcSwapCandle } from './database/models';
import { getMaxCandles, getMaxCandlesWithGranularity } from './okex/common';

(async function main() {
  //连接数据库
  await connectMongo();
  // await getMaxCandles('BTC-USD-SWAP');
  // await getMaxCandles('BTC-USDT-SWAP');
  await getMaxCandlesWithGranularity('ETH-USDT-SWAP', 86400);
  process.exit();
  // await BtcSwapCandle.remove({ granularity: 43100 });
  // await InstrumentCandle.aggregate([
  //   {
  //     $match: {
  //       underlying_index: "BTC",
  //       alias: { $in: ["swap"] },
  //       // alias: { $in: ["this_week", "next_week", "quarter"] },
  //     },
  //   },
  //   { $out: "btc_swap_candles" },
  // ])
  //   .then((res) => {
  //     console.log(res);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
})();
