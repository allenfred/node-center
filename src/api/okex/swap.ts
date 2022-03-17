import * as bluebird from 'bluebird';
import logger from '../../logger';
import { Instrument } from '../../types';
import { InstrumentInfoDao } from '../../dao';
import { getOkxSwapInsts } from './client';
import { getLatestKlines } from './common';

export async function initOkxInsts(): Promise<Instrument[]> {
  //获取全量永续合约信息
  let instruments: Array<Instrument> = await getOkxSwapInsts();

  // BTC合约及其他USDT本位合约
  instruments = instruments.filter((i) => i.quote_currency === 'USDT' || i.quote_currency === 'BTC' || i.underlying_index === 'BTC');
  logger.info(`Okx[永续合约] - 获取公共合约全量信息成功，共: ${instruments.length} 条 ...`);

  //更新永续合约信息
  await InstrumentInfoDao.upsert(instruments);
  logger.info(`Okx[永续合约] - 公共合约全量信息更新数据库成功 ...`);

  return instruments;
}

export async function initOkxKlines(instruments: Instrument[]): Promise<void> {
  //获取所有时间粒度请求参数 如[60/180/300 900/1800/3600/7200/14400/21600/43200/86400]

  return bluebird.map(
    instruments,
    async (instrument: Instrument) => {
      logger.info(`!!! Okx[永续合约] - 开始请求 ${instrument.instrument_id} Klines !!!`);
      await getLatestKlines(instrument.instrument_id);
      logger.info(`!!! Okx[永续合约] - ${instrument.instrument_id} Klines 请求完成 !!!`);
      return;
    },
    { concurrency: 1 }
  );

  // const options: Array<{
  //   start: string;
  //   end: string;
  //   granularity: number;
  // }> = getKlineReqOptions();
  // const readyOptions = [];

  // //初始化所有合约candle请求参数
  // instruments
  //   // .filter(i => isMainCurrency(i.underlying_index))
  //   .map((instrument: Instrument) => {
  //     for (let option of options) {
  //       readyOptions.push(Object.assign({}, option, instrument, { alias: 'swap' }));
  //     }
  //   });

  // logger.info(`[永续合约] - 获取candle数据需请求 ${readyOptions.length} 次 ...`);
  // await getKlinesWithLimited(readyOptions);
}
