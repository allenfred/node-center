import connectMongo from '../database/connection';
import { initInstruments, getHistoryKlines } from '../api/okex';
import { InstrumentInfoDao, InstrumentKlineDao } from '../dao';
import { Exchange } from '../types';
import * as _ from 'lodash';
import logger from '../logger';
import { getCommandOpts } from './util';

const args = process.argv.slice(2);

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
// */5 * * * * At every 5 minute.
export const startJob = async () => {
  logger.info('---- Init Okex Klines Job Start Executing ----');
  const startTime = new Date().getTime();
  const opt = getCommandOpts(args);

  await connectMongo();
  const insts = await InstrumentInfoDao.findAll().then((inst) => {
    return inst.filter((i: any) => i.exchange === Exchange.Okex);
  });

  await getHistoryKlines(insts, opt);

  const endTime = new Date().getTime();
  const usedTime = ((endTime - startTime) / 1000).toFixed(1);

  logger.info(`----- Job End Time Used: ${usedTime}s -----`);

  process.exit(0);
};

startJob();
