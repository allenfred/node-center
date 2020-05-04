import connectMongo from "./database/connection";
import { getBtcMaxCandles } from "./okex/currency/btc";
import { InstrumentCandle } from "./database/models";
import { getBtcFutureMaxCandles, getBtcSwapMaxCandles } from "./okex/common";

(async function main() {
  //连接数据库
  await connectMongo();
  // currency
  // await getBtcMaxCandles();
  await getBtcSwapMaxCandles();
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
