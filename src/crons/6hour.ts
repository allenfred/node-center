import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// 10 */6 * * *  At minute 10 past every 6th hour.
const startJob = async () => {
  logger.info('---- 6hourJob Start Executing ----');
  await connectMongo();
  await execJob(Job_Granularity.SixHour);
  logger.info('----- Job End -----');
  process.exit(0);
};

startJob();
