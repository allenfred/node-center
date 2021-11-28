import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// 10 */12 * * *  At minute 10 past every 12th hour.
const startJob = async () => {
  logger.info('---- 12hourJob Start Executing ----');
  await connectMongo();
  await execJob(Job_Granularity.TwelveHour);
  logger.info('----- Job End -----');
  process.exit(0);
};

startJob();
