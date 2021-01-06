var schedule = require('node-schedule');
import { execJob } from './util';
import * as currencyAPI from '../okex/currency';
import * as commonAPI from '../okex/common';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
export async function startSchedule() {
  // At every 5 minute.
  schedule.scheduleJob('*/5 * * * *', async () => {
    logger.info('----Every5MinsJob Start Executing----');
    await execJob(60 * 5);
    await execJob(60 * 15);
  });

  // every day - At 00:05.
  schedule.scheduleJob('5 0 * * *', async () => {
    logger.info('----EveryDayJob Start Executing----');
    await execJob(60 * 1440);

    // 获取最多过去1440条k线数据
    await currencyAPI.getBtcMaxCandles();
    await commonAPI.getBtcSwapMaxCandles();
  });

  // every 4 hours - At minute 5 past every 4th hour.
  schedule.scheduleJob('5 */4 * * *', async () => {
    logger.info('----Every4HourJob Start Executing----');
    await execJob(60 * 240);
  });

  // every 2 hours - At minute 5 past every 2nd hour.
  schedule.scheduleJob('5 */2 * * *', async () => {
    logger.info('----Every2HoursJob Start Executing----');
    await execJob(60 * 120);
  });

  // every hour - At minute 5.
  schedule.scheduleJob('0 * * * *', async () => {
    logger.info('----EveryHourJob Start Executing----');
    await execJob(60 * 60);

    // 获取最近200条k线数据
    await currencyAPI.getBtcLatestCandles();
    await commonAPI.getBtcSwapLatestCandles();
  });
}
