import { Job_Granularity, execJob } from './util';
import connectMongo from '../database/connection';
import { initOkxInsts, getOkxHistoryKlines } from '../api/okex';

import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// */5 * * * * At every 5 minute.
export const startJob = async () => {
  logger.info('---- Init Okex Klines Job Start Executing ----');
  const startTime = new Date().getTime();

  await connectMongo();
  const insts = await initOkxInsts();
  await getOkxHistoryKlines(insts);

  const endTime = new Date().getTime();
  const usedTime = ((endTime - startTime) / 1000).toFixed(1);

  logger.info(`----- Job End Time Used: ${usedTime}s -----`);

  process.exit(0);
};

startJob();
