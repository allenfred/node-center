import * as futures from './futures';
import * as swap from './swap';
import * as common from './common';
import { startSchedule } from '../schedule';

export async function initOkexMarketMonitor() {
  // 开启定时任务获取历史K线
  startSchedule();
}
