import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import * as commonAPI from '../api/common';
import logger from '../logger';
import { Exchange } from '../types';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// */5 * * * * At every 5 minute.
export const startJob = async () => {
  logger.info('---- 5mins Job Start Executing ----');
  const startTime = new Date().getTime();
  const dayNow = new Date().getDay();
  const hourNow = new Date().getHours();
  const minuteNow = new Date().getMinutes();

  await connectMongo();
  await execJob(Job_Granularity.FiveMins);

  // 15 minutes.
  if (minuteNow % 15 === 0) {
    await execJob(Job_Granularity.FifteenMins);
  }

  // half-hourly
  if (minuteNow % 30 === 0) {
    await execJob(Job_Granularity.HalfHour);
  }

  // hourly
  if (minuteNow === 5) {
    await execJob(Job_Granularity.OneHour);
  }

  // 2hourly
  if (hourNow % 2 === 0 && minuteNow === 5) {
    await execJob(Job_Granularity.TwoHour);
  }

  // 4hourly
  if (hourNow % 4 === 0 && minuteNow === 5) {
    await execJob(Job_Granularity.FourHour);
  }

  // 6hourly
  if (hourNow % 6 === 0 && minuteNow === 5) {
    await execJob(Job_Granularity.SixHour);
  }

  // 12hourly
  if (hourNow % 12 === 0 && minuteNow === 5) {
    await execJob(Job_Granularity.TwelveHour);
  }

  // At 00:05.
  if (hourNow === 0 && minuteNow === 5) {
    await execJob(Job_Granularity.OneDay);
  }

  // At 00:10.
  // if (hourNow === 0 && minuteNow === 10) {
  //   await currencyAPI.getOkxBtcLatestKlines();
  // }

  // At 00:15.
  if (hourNow === 0 && minuteNow === 15) {
    await commonAPI.getLatestKlines({
      exchange: Exchange.Okex,
      instId: 'BTC-USDT-SWAP',
      count: 500,
    });
    await commonAPI.getLatestKlines({
      exchange: Exchange.Biance,
      instId: 'BTCUSDT',
      count: 500,
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
