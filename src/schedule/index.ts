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
  isDailyScheduleTime
} from "./util";
import { getBtcLatestCandles, getBtcMaxCandles } from "../okex/currency";
import logger from "../logger";

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
export async function startSchedule() {
  schedule.scheduleJob("*/15 * * * *", async () => {
    logger.info("----Every15MinsJob Start Executing----");
    await execJob(60 * 15);
  });

  // every week.
  schedule.scheduleJob("0 0 * * 0", () => {
    logger.info("----执行 周线 K线定时任务----");
    execJob(60 * 1440 * 7);
  });

  // every day
  schedule.scheduleJob("0 0 * * *", async () => {
    logger.info("----EveryDayJob Start Executing----");
    await execJob(60 * 1440);
  });

  // every 12 hours
  schedule.scheduleJob("0 */12 * * *", async () => {
    logger.info("----Every12HoursJob Start Executing----");
    await execJob(60 * 720);
  });

  // every 4 hours
  schedule.scheduleJob("0 */4 * * *", async () => {
    logger.info("----Every4HourJob Start Executing----");
    await execJob(60 * 240);
  });

  // every 2 hours
  schedule.scheduleJob("0 */2 * * *", async () => {
    logger.info("----Every2HoursJob Start Executing----");
    await execJob(60 * 120);
  });

  // every hour
  schedule.scheduleJob("0 * * * *", async () => {
    logger.info("----EveryHourJob Start Executing----");
    await execJob(60 * 60);
    await getBtcMaxCandles();
    await getBtcLatestCandles();
  });
}
