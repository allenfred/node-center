import connectMongo from '../database/connection';
import * as commonAPI from '../api/common';
import logger from '../logger';
import { Exchange } from '../types';

const myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);
const instId = myArgs[0];

const startJob = async () => {
  const startTime = new Date().getTime();
  await connectMongo();

  if (instId.endsWith('SWAP')) {
    await commonAPI.getKlines({
      exchange: Exchange.Okex,
      instId,
      count: 500,
    });
  }

  if (instId.endsWith('USDT')) {
    await commonAPI.getKlines({
      exchange: Exchange.Biance,
      instId,
      count: 500,
    });
  }

  const endTime = new Date().getTime();
  const usedTime = ((endTime - startTime) / 1000).toFixed(1);

  logger.info(`----- Job End Time Used: ${usedTime}s -----`);

  process.exit(0);
};

startJob();
