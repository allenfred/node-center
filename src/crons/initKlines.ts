import connectMongo from '../database/connection';
import { InstrumentInfoDao } from '../dao';
import * as binance from '../api/binance';
import * as bybit from '../api/bybit';
import * as okex from '../api/okex';
import { Exchange } from '../types';
import logger from '../logger';
import { getCommandOpts } from './util';

export const startJob = async () => {
  logger.info('---- Init Bybit Klines Job Start Executing ----');
  const startTime = new Date().getTime();

  await connectMongo();

  const insts = await InstrumentInfoDao.find({});
  const binanceInsts = insts.filter(
    (i: any) => i.exchange === Exchange.Binance,
  );
  const bybitInsts = insts.filter((i: any) => i.exchange === Exchange.Bybit);
  const okexInsts = insts.filter((i: any) => i.exchange === Exchange.Okex);

  await binance.getHistoryKlines(binanceInsts, { count: 1000 });
  // await bybit.getHistoryKlines(bybitInsts, { count: 1000 });
  await okex.getHistoryKlines(okexInsts, { count: 1000 });

  const endTime = new Date().getTime();
  const usedTime = ((endTime - startTime) / 1000).toFixed(1);

  logger.info(`----- Job End Time Used: ${usedTime}s -----`);

  process.exit(0);
};

startJob();