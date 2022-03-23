import * as bluebird from 'bluebird';
import logger from '../../logger';
import { Exchange, Instrument } from '../../types';
import { InstrumentInfoDao } from '../../dao';
import { getBianceSwapInsts } from './client';
import { getLatestKlines } from './../common';

export async function initBianceInsts(): Promise<Instrument[]> {
  //获取全量永续合约信息
  let instruments: Array<Instrument> = await getBianceSwapInsts();

  // BTC合约及其他USDT本位合约
  instruments = instruments.filter((i) => i.instrument_id.endsWith('USDT'));
  logger.info(
    `Biance[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`,
  );

  //更新永续合约信息
  await InstrumentInfoDao.upsert(instruments);
  logger.info(`Biance[永续合约] - 公共合约全量信息更新数据库成功 ...`);

  return instruments;
}

export async function getBianceHistoryKlines(
  instruments: Instrument[],
): Promise<void> {
  return bluebird.map(
    instruments,
    async (instrument: Instrument) => {
      return await getLatestKlines({
        exchange: Exchange.Biance,
        instId: instrument.instrument_id,
        count: 500,
      });
    },
    { concurrency: 2 },
  );
}
