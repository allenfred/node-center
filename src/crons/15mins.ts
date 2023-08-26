import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import * as commonAPI from '../api/common';
import logger from '../logger';
import { Exchange } from '../types';
import * as Okex from '../api/okex';
import * as Binance from '../api/binance';
import * as Bybit from '../api/bybit';
import * as moment from 'moment';
import { UsdtSwapSignal } from '../database/models';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// */5 * * * * At every 5 minute.
export const startJob = async () => {
  logger.info('---- 5mins Job Start Executing ----');
  const startTime = new Date().getTime();
  const dayNow = new Date().getDay();
  const hourNow = new Date().getHours();
  const minuteNow = new Date().getMinutes();

  await connectMongo();

  // 15 minutes.
  if (minuteNow % 15 === 0) {
    await execJob(Job_Granularity.FifteenMins);
  }

  // hourly
  if (minuteNow === 0) {
    await Okex.initInstruments();
    await Binance.initInstruments();
    // await Bybit.initInstruments();
    await execJob(Job_Granularity.OneHour);
  }

  // 2hourly
  if (hourNow % 2 === 0 && minuteNow === 0) {
    await execJob(Job_Granularity.TwoHour);
  }

  // 4hourly
  if (hourNow % 4 === 0 && minuteNow === 0) {
    await execJob(Job_Granularity.FourHour);
    await execJob(Job_Granularity.OneDay);
  }

  // 6hourly
  if (hourNow % 6 === 0 && minuteNow === 0) {
    await execJob(Job_Granularity.SixHour);
  }

  // 12hourly
  if (hourNow % 12 === 0 && minuteNow === 0) {
    await Okex.initInstruments();
    await Binance.initInstruments();
    // await Bybit.initInstruments();
    await execJob(Job_Granularity.TwelveHour);
  }

  // At minute 0 on every day.
  if (hourNow === 0 && minuteNow === 0) {
    const daysAgo = moment().utc().add(-31, 'd').toDate();
    await UsdtSwapSignal.deleteMany({
      timestamp: { $lte: daysAgo },
    }).then((res) => {
      logger.info(res);
    });
  }

  // At minute 15 on Monday.
  if (dayNow === 1 && hourNow === 0 && minuteNow === 15) {
    await execJob(Job_Granularity.Weekly);
  }

  const endTime = new Date().getTime();
  const usedTime = ((endTime - startTime) / 1000).toFixed(1);

  logger.info(`----- Job End Time Used: ${usedTime}s -----`);

  process.exit(0);
};

startJob();
