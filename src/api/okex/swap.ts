import * as bluebird from 'bluebird';
import logger from '../../logger';
import { Exchange, Instrument } from '../../types';
import { InstrumentInfoDao } from '../../dao';
import { getOkxSwapInsts } from './client';
import { getLatestKlines } from './../common';

export async function initOkxInsts(): Promise<Instrument[]> {
  //获取全量永续合约信息
  let instruments: Array<Instrument> = await getOkxSwapInsts();

  // BTC合约及其他USDT本位合约
  instruments = instruments.filter((i) =>
    i.instrument_id.endsWith('USDT-SWAP'),
  );
  logger.info(
    `Okx[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`,
  );

  //更新永续合约信息
  await InstrumentInfoDao.upsert(instruments);
  logger.info(`Okx[永续合约] - 公共合约全量信息更新数据库成功 ...`);

  return instruments;
}

export async function getOkxHistoryKlines(
  instruments: Instrument[],
  days?: number,
): Promise<void> {
  //获取所有时间粒度请求参数 如[60/180/300 900/1800/3600/7200/14400/21600/43200/86400]
  return bluebird.map(
    instruments,
    async (instrument: Instrument) => {
      return await getLatestKlines({
        exchange: Exchange.Okex,
        instId: instrument.instrument_id,
        count: 300,
      });
    },
    { concurrency: 2 },
  );
}
