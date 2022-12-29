import connectMongo from '../database/connection';
import * as commonAPI from '../api/common';
import { getExchangeInfo } from '../api/binance';
import { InstrumentKlineDao } from '../dao';
import logger from '../logger';
import { Exchange } from '../types';
import * as Okex from '../api/okex';
import * as Binance from '../api/binance';

/**
 * -i: init instruments
 *
 * -e: getExchangeInfo
 *
 * -k: get klines
 *     -t interval
 *
 */
const myArgs = process.argv.slice(2);

const startJob = async () => {
  if (!myArgs.length) {
    logger.info('缺少参数');
    return;
  }

  const startTime = new Date().getTime();

  await connectMongo();

  if (myArgs[0] === '-i') {
    const data = await Binance.initInstruments();
    data.map((i) => {});
  }

  if (myArgs[0] === '-e') {
    const data = await getExchangeInfo();
    console.log(data.rateLimits);
  }

  if (myArgs[0] === '-k') {
    const instId = myArgs[1].toUpperCase();

    if (instId.endsWith('SWAP')) {
      await commonAPI.getOkexKlines(
        commonAPI.getKlinesReqParams({
          exchange: Exchange.Okex,
          instId,
          count: 1500,
        }),
      );
    }

    if (instId.endsWith('USDT')) {
      await commonAPI.getBinanceKlines(
        commonAPI.getKlinesReqParams({
          exchange: Exchange.Binance,
          instId,
          count: 1500,
        }),
      );

      await commonAPI.getBybitKlines(
        commonAPI.getKlinesReqParams({
          exchange: Exchange.Bybit,
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
