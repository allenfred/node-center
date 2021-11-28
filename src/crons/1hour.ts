import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import { InstrumentInfo } from '../database/models/instrumentInfo';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// 5 * * * *  At minute 5.
const startJob = async () => {
  logger.info('---- EveryHourJob Start Executing ----');
  await connectMongo();
  await execJob(Job_Granularity.OneHour);
  logger.info('----- Job End -----');
  process.exit(0);
};

startJob();
