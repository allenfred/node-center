import * as futures from './futures';
import * as swap from './swap';
import * as common from './common';
import { startSchedule } from '../schedule';

export async function initOkexMarketMonitor() {
  // 获取所有合约信息
  const futuresInstruments = await futures.initInstruments();
  const swapInstruments = await swap.initInstruments();

  // 开启定时任务获取历史K线
  startSchedule(futuresInstruments, swapInstruments);
}
