import connectMongo from '../database/connection';
import * as commonAPI from '../api/common';
import { Exchange } from '../types';
import { UsdtSwapKline, BtcSwapKline } from '../database/models';

export const task = async () => {
  await connectMongo();
  const res = await UsdtSwapKline.deleteMany({
    timestamp: { $gte: '2022-03-17' },
  });
  console.log(res);
};

task();
