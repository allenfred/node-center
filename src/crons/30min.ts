import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// */30 * * * * At every 30 minute.
const startJob = async () => {
  logger.info('---- 30mins Job Start Executing ----');
  await connectMongo();
  await execJob(Job_Granularity.HalfHour);
  logger.info('----- Job End -----');
  process.exit(0);
};

startJob();
