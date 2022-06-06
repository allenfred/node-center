import connectMongo from '../database/connection';
import { initInstruments, getHistoryKlines } from '../api/okex';
import * as _ from 'lodash';
import logger from '../logger';
const args = process.argv.slice(2);

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// */5 * * * * At every 5 minute.
export const startJob = async () => {
  logger.info('---- Init Okex Klines Job Start Executing ----');
  const startTime = new Date().getTime();
  const opt: any = {};
  if (args.includes('-i') && args.length > args.indexOf('-i') + 1) {
    opt.includeInst = [args[args.indexOf('-i') + 1]];
  }

  if (args.includes('-g') && args.length > args.indexOf('-g') + 1) {
    opt.includeInterval = [+args[args.indexOf('-g') + 1]];
  }

  await connectMongo();
  const insts = await initInstruments();
  await getHistoryKlines(insts, opt);

  const endTime = new Date().getTime();
  const usedTime = ((endTime - startTime) / 1000).toFixed(1);

  logger.info(`----- Job End Time Used: ${usedTime}s -----`);

  process.exit(0);
};

startJob();
