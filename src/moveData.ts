import connectMongo from "./database/connection";
import { startSchedule } from "./schedule";
import {} from "./dao/instrumentCandle";
import { InstrumentCandle } from "./database/models";

(async function main() {
  //连接数据库
  await connectMongo();
  // 开启定时任务获取历史K线
  // startSchedule();
  console.log("------");

  await InstrumentCandle.aggregate([
    {
      $match: {
        underlying_index: "LTC",
        alias: { $in: ["this_week", "next_week", "quarter"] }
      }
    },
    { $out: "ltc_future_candles" }
  ])
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.log(err);
    });
})();
