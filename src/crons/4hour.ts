import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// 5 */4 * * *  At minute 5 past every 4th hour.
const startJob = async () => {
  logger.info('---- 4hourJob Start Executing ----');
  await connectMongo();
  await execJob(Job_Granularity.FourHour);
  logger.info('----- Job End -----');
  process.exit(0);
};

startJob();
