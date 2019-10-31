var schedule = require('node-schedule');
import { Instrument } from '../types';
import {
  execJob,
  isThreeMinutesScheduleTime,
  isFiveMinutesScheduleTime,
  isFifteenMinutesScheduleTime,
  isThirtyMinutesScheduleTime,
  isHourlyScheduleTime,
  isTwoHoursScheduleTime,
  isFourHoursScheduleTime,
  isSixHoursScheduleTime,
  isTwelveHoursScheduleTime,
  isDailyScheduleTime,
} from './util';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
export function startSchedule(futures: Instrument[], swaps: Instrument[]) {
  schedule.scheduleJob('*/5 * * * *', async () => {
    const currentDate = new Date();

    if (isDailyScheduleTime(currentDate)) {
      logger.info('----执行 日线 K线定时任务----');
      await execJob(futures, swaps, 60 * 1440);
    }

    if (isTwelveHoursScheduleTime(currentDate)) {
      logger.info('----执行 12小时 K线定时任务----');
      await execJob(futures, swaps, 60 * 720);
    }

    if (isSixHoursScheduleTime(currentDate)) {
      logger.info('----执行 6小时 K线定时任务----');
      await execJob(futures, swaps, 60 * 360);
    }

    if (isFourHoursScheduleTime(currentDate)) {
      logger.info('----执行 4小时 K线定时任务----');
      await execJob(futures, swaps, 60 * 240);
    }

    if (isTwoHoursScheduleTime(currentDate)) {
      logger.info('----执行 2小时 K线定时任务----');
      await execJob(futures, swaps, 60 * 120);
    }

    if (isHourlyScheduleTime(currentDate)) {
      logger.info('----执行 1小时 K线定时任务----');
      await execJob(futures, swaps, 60 * 60);
    }

    if (isThirtyMinutesScheduleTime(currentDate)) {
      logger.info('----执行 30分钟 K线定时任务----');
      await execJob(futures, swaps, 60 * 30);
    }

    if (isFifteenMinutesScheduleTime(currentDate)) {
      logger.info('----执行 15分钟 K线定时任务----');
      await execJob(futures, swaps, 60 * 15);
    }

    if (isFiveMinutesScheduleTime(currentDate)) {
      logger.info('----执行 5分钟 K线定时任务----');
      await execJob(futures, swaps, 60 * 5);
    }

    if (isThreeMinutesScheduleTime(currentDate)) {
      logger.info('----执行 3分钟 K线定时任务----');
      await execJob(futures, swaps, 60 * 3);
    }

    logger.info('----执行 1分钟 K线定时任务----');
    await execJob(futures, swaps, 60);
  });

  // every week.
  schedule.scheduleJob('0 0 * * 0', () => {
    logger.info('----执行 周线 K线定时任务----');
    execJob(futures, swaps, 60 * 1440 * 7);
  });
}
