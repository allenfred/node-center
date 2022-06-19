import connectMongo from '../database/connection';
import * as commonAPI from '../api/common';
import { getExchangeInfo } from '../api/biance/client';
import { InstrumentKlineDao } from '../dao';
import logger from '../logger';
import { Exchange } from '../types';
import * as Okex from '../api/okex';
import * as Biance from '../api/biance';

const myArgs = process.argv.slice(2);

const startJob = async () => {
  if (!myArgs.length) {
    logger.info('缺少参数');
    // logger.info('缺少参数');
    return;
  }

  const startTime = new Date().getTime();

  await connectMongo();

  if (myArgs[0] === '-i') {
    const data = await Biance.initInstruments();
    data.map((i) => {
      if (i.base_currency === 'TLM') {
        console.log(i);
      }
    });
  }

  if (myArgs[0] === '-e') {
    const data = await getExchangeInfo();
    console.log(data.rateLimits);
  }

  if (myArgs[0] === '-k') {
    const instId = myArgs[1].toUpperCase();

    if (instId.endsWith('SWAP')) {
      await commonAPI.getKlines({
        exchange: Exchange.Okex,
        instId,
        count: 500,
      });
    }

    if (instId.endsWith('USDT')) {
      await commonAPI.getBianceKlines(
        commonAPI.getKlinesReqParams({
          exchange: Exchange.Biance,
          instId,
          count: 1500,
        }),
      );
    }
  }

  const endTime = new Date().getTime();
  const usedTime = ((endTime - startTime) / 1000).toFixed(1);

  logger.info(`----- Job End Time Used: ${usedTime}s -----`);

  process.exit(0);
};

startJob();
