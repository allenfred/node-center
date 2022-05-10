import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import logger from '../../logger';
import { Exchange, Instrument } from '../../types';
import { InstrumentInfoDao } from '../../dao';
import { InstrumentInfo } from '../../database/models';
import { getBianceSwapInsts } from './client';
import { getKlines } from './../common';

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
  let data: any = await InstrumentInfoDao.find({ exchange: Exchange.Biance });
  data = data.filter((i: Instrument) => i.klines !== 1);

  logger.info(`Biance[永续合约] - 待初始化K线的合约数量 ${data.length} ...`);

  return _.sortBy(data, ['instrument_id']);
}

export async function getBianceHistoryKlines(
  instruments: Instrument[],
): Promise<void> {
  return bluebird.map(
    instruments,
    async (inst: Instrument) => {
      await getKlines({
        exchange: Exchange.Biance,
        instId: inst.instrument_id,
        count: 1500,
      });

      return InstrumentInfo.updateOne(
        { exchange: Exchange.Biance, instrument_id: inst.instrument_id },
        { klines: 1 },
      );
    },
    { concurrency: 2 },
  );
}
