import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// */15 * * * * At every 15 minute.
const startJob = async () => {
  logger.info('---- 15Mins Job Start Executing ----');
  await connectMongo();
  await execJob(Job_Granularity.FifteenMins);
  logger.info('----- Job End -----');
  process.exit(0);
};

startJob();
