import { getKlinesWithLimited } from '../api/common';
import { getTimestamp, getISOString, getCountByHoursAgo } from '../util';
import { InstrumentInfo } from '../database/models';
import { Instrument, InstReqOptions, Exchange } from '../types';
import * as Okex from '../api/okex';
import * as Biance from '../api/biance';
import { sortBy } from 'lodash';

const Job_Granularity = {
  FiveMins: 60 * 5,
  FifteenMins: 60 * 15,
  HalfHour: 60 * 30,
  OneHour: 60 * 60,
  TwoHour: 60 * 120,
  FourHour: 60 * 240,
  SixHour: 60 * 360,
  TwelveHour: 60 * 720,
  OneDay: 60 * 1440,
  Weekly: 60 * 1440 * 7,
};

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
async function execJob(granularity: number) {
  const hourNow = new Date().getHours();
  const minuteNow = new Date().getMinutes();

  // 获取所有合约信息
  const insts: Instrument[] = await InstrumentInfo.find({});
  // 5min / 30min / 2h / 6h / 1w
  const jobsForBtcOnly = [
    Job_Granularity.FiveMins,
    Job_Granularity.HalfHour,
    Job_Granularity.TwoHour,
    Job_Granularity.SixHour,
    Job_Granularity.Weekly,
  ];

  const customFilter = (i: Instrument) => {
    if (jobsForBtcOnly.includes(granularity)) {
      return i.underlying_index === 'BTC';
    } else {
      return i.quote_currency === 'USDT';
    }
  };

  const validInsts = sortBy(insts.filter(customFilter), ['instrument_id']);

  // 每12h更新过去24h全量数据

  let count = 10;
  if (
    hourNow % 12 === 0 &&
    [Job_Granularity.FifteenMins, Job_Granularity.OneHour].includes(granularity)
  ) {
    count = getCountByHoursAgo(24, granularity);
  }

  // 最近 10 条K线数据
  await Okex.getHistoryKlines(
    validInsts.filter((i: any) => i.exchange === Exchange.Okex),
    { count, includeInterval: [granularity] },
  );

  await Biance.getHistoryKlines(
    validInsts.filter((i: any) => i.exchange === Exchange.Biance),
    {
      count,
      delay: 1000,
      includeInterval: [granularity],
    },
  );
}

export { Job_Granularity, execJob };
