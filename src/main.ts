var schedule = require('node-schedule');
import { EventEmitter } from 'events';
import { V3WebsocketClient } from '@okfe/okex-node';
import { wsHost } from './config';
import logger from './logger';
import { initOkexMarketMonitor } from './okex';
import connectMongo from './database/connection';
import * as futures from './okex/futures';
import * as swap from './okex/swap';
import { startSchedule } from './schedule';

(async function main() {
  //连接数据库
  await connectMongo();
  // 获取所有合约信息
  const futuresInstruments = await futures.initInstruments();
  const swapInstruments = await swap.initInstruments();

  // 开启定时任务获取历史K线
  startSchedule(futuresInstruments, swapInstruments);
})();
