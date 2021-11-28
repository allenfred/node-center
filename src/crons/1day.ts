import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import * as currencyAPI from '../okex/currency';
import * as commonAPI from '../okex/common';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// 15 0 * * * At 00:15.
const startJob = async () => {
  await connectMongo();
  logger.info('---- EveryDayJob Start Executing ----');
  await execJob(Job_Granularity.OneDay);
  await currencyAPI.getBtcMaxCandles();
  await commonAPI.getMaxCandles('BTC-USD-SWAP');
  await commonAPI.getMaxCandles('BTC-USDT-SWAP');
  logger.info('----- Job End -----');
  process.exit(0);
};

startJob();
