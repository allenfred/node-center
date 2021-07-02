var schedule = require('node-schedule');
import { Job_Granularity, execJob } from './util';
import * as currencyAPI from '../okex/currency';
import * as commonAPI from '../okex/common';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
export async function startSchedule() {
  await commonAPI.getBtcUsdSwapMaxCandles();
  await commonAPI.getBtcUsdtSwapMaxCandles();

  // At every 5 minute.
  schedule.scheduleJob('*/5 * * * *', async () => {
    logger.info('----Every 5Mins Job Start Executing----');
    await execJob(Job_Granularity.FiveMins);
    await execJob(Job_Granularity.FifteenMins);
  });

  // every day - At 00:05.
  schedule.scheduleJob('5 0 * * *', async () => {
    logger.info('----EveryDayJob Start Executing----');
    await execJob(Job_Granularity.OneDay);

    await currencyAPI.getBtcMaxCandles();
    await commonAPI.getBtcUsdSwapMaxCandles();
    await commonAPI.getBtcUsdtSwapMaxCandles();
  });

  // every 4 hours - At minute 5 past every 4th hour.
  schedule.scheduleJob('5 */4 * * *', async () => {
    logger.info('----Every4HourJob Start Executing----');
    await execJob(Job_Granularity.FourHour);
  });

  // every 2 hours - At minute 5 past every 2nd hour.
  schedule.scheduleJob('5 */2 * * *', async () => {
    logger.info('----Every2HoursJob Start Executing----');
    await execJob(Job_Granularity.TwoHour);
  });

  // every hour - At minute 5.
  schedule.scheduleJob('0 * * * *', async () => {
    logger.info('----EveryHourJob Start Executing----');
    await execJob(Job_Granularity.OneHour);
  });
}
