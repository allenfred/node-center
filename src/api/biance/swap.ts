import * as bluebird from 'bluebird';
import logger from '../../logger';
import { Instrument } from '../../types';
import { InstrumentInfoDao } from '../../dao';
import { getKlineReqOptions } from '../../util';
import { getBianceSwapInsts } from './client';
import { getKlinesWithLimited, getMaxKlines } from './common';

export async function initBianceInsts(): Promise<Instrument[]> {
  //获取全量永续合约信息
  let instruments: Array<Instrument> = await getBianceSwapInsts();

  // BTC合约及其他USDT本位合约
  instruments = instruments.filter((i) => (i.quote_currency === 'USDT' || i.quote_currency === 'BTC' || i.underlying_index === 'BTC') && i.quote_currency !== 'BUSD');
  logger.info(`Biance[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`);

  //更新永续合约信息
  await InstrumentInfoDao.upsert(instruments);
  logger.info(`Biance[永续合约] - 公共合约全量信息更新数据库成功 ...`);

  return instruments;
}

export async function initBianceKlines(instruments: Instrument[]): Promise<void> {
  return bluebird.map(
    instruments,
    async (instrument: Instrument) => {
      logger.info(`!!! Biance[永续合约] - 开始请求 ${instrument.instrument_id} Klines !!!`);
      await getMaxKlines(instrument.instrument_id);
      logger.info(`!!! Biance[永续合约] - ${instrument.instrument_id} Klines 请求完成 !!!`);
      return;
    },
    { concurrency: 1 }
  );
}
