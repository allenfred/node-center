import * as bluebird from 'bluebird';
import logger from '../logger';
import { Instrument } from '../types';
import { InstrumentInfoDao } from '../dao';
import { getCandleRequestOptions, isMainCurrency, getISOString } from '../util';
import { getCandles, getCandlesWithLimitedSpeed, getSwapInstruments } from './common';

export async function initInstruments(): Promise<Instrument[]> {
  //获取全量永续合约信息
  const instruments: Array<Instrument> = await getSwapInstruments();
  logger.info(`[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`);

  //更新永续合约信息
  await InstrumentInfoDao.upsert(instruments);
  logger.info(`[永续合约] - 公共合约全量信息更新数据库成功 ...`);

  return instruments;
}
