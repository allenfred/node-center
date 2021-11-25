var schedule = require('node-schedule');
import { Job_Granularity, execJob } from './util';
import * as currencyAPI from '../okex/currency';
import * as commonAPI from '../okex/common';
import logger from '../logger';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)

const startJob = async () => {
  logger.info('---- Every 5Mins Job Start Executing ----');
  const min = new Date().getMinutes();
  await execJob(Job_Granularity.FiveMins);
};

startJob();
