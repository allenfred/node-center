import connectMongo from "./database/connection";
import { getBtcMaxCandles } from "./okex/currency/btc";

(async function main() {
  //连接数据库
  await connectMongo();
  console.log("------");
  await getBtcMaxCandles();
})();
