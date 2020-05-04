var schedule = require("node-schedule");
import {
  execJob,
  isFifteenMinutesScheduleTime,
  isThirtyMinutesScheduleTime,
  isHourlyScheduleTime,
  isTwoHoursScheduleTime,
  isFourHoursScheduleTime,
  isSixHoursScheduleTime,
  isTwelveHoursScheduleTime,
  isDailyScheduleTime,
} from "./util";
import { getBtcLatestCandles, getBtcMaxCandles } from "../okex/currency";
import logger from "../logger";

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
export async function startSchedule() {
  // At every 15th minute.
  schedule.scheduleJob("*/15 * * * *", async () => {
    logger.info("----Every15MinsJob Start Executing----");
    await execJob(60 * 15);
  });

  // every week.
  schedule.scheduleJob("0 0 * * 0", () => {
    logger.info("----执行 周线 K线定时任务----");
    execJob(60 * 1440 * 7);
  });

  // every day - At 00:05.
  schedule.scheduleJob("5 0 * * *", async () => {
    logger.info("----EveryDayJob Start Executing----");
    await execJob(60 * 1440);
  });

  // every 12 hours - At 12:05.
  schedule.scheduleJob("5 12 * * *", async () => {
    logger.info("----Every12HoursJob Start Executing----");
    await execJob(60 * 720);
  });

  // every 4 hours - At minute 5 past every 4th hour.
  schedule.scheduleJob("5 */4 * * *", async () => {
    logger.info("----Every4HourJob Start Executing----");
    await execJob(60 * 240);
  });

  // every 2 hours - At minute 5 past every 2nd hour.
  schedule.scheduleJob("5 */2 * * *", async () => {
    logger.info("----Every2HoursJob Start Executing----");
    await execJob(60 * 120);
  });

  // every hour - At minute 5.
  schedule.scheduleJob("0 * * * *", async () => {
    logger.info("----EveryHourJob Start Executing----");
    await execJob(60 * 60);
    // 获取最多过去1440条k线数据
    await getBtcMaxCandles();
    // 获取最近200条k线数据
    await getBtcLatestCandles();
  });
}
