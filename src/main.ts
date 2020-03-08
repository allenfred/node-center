import connectMongo from "./database/connection";
import { startSchedule } from "./schedule";

(async function main() {
  //连接数据库
  await connectMongo();
  // 开启定时任务获取历史K线
  startSchedule();
})();
