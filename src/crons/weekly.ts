import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// 5 * * * 1 At minute 5 on Monday.
const startJob = async () => {
  logger.info('---- weekly Job Start Executing ----');
  await connectMongo();
  await execJob(Job_Granularity.Weekly);
  logger.info('----- Job End -----');
  process.exit(0);
};

startJob();
