import connectMongo from '../database/connection';
import * as commonAPI from '../api/common';
import { Exchange } from '../types';
import { UsdtSwapKline } from '../database/models';
import { initInstruments as initBinanceInsts } from '../api/binance';
import { initInstruments as initOkxInsts } from '../api/okex';

export const task = async () => {
  await connectMongo();
  // const res = await UsdtSwapKline.deleteMany({
  //   timestamp: { $gte: '2022-03-17' },
  // });
  // console.log(res);

  const data = await initOkxInsts();
  console.log(data);
};

task();