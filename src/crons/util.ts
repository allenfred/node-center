import { getKlinesWithLimited } from '../api/common';
import { getTimestamp, getISOString, getCountByHoursAgo } from '../util';
import { InstrumentInfoDao, InstrumentKlineDao } from '../dao';
import { InstrumentInfo } from '../database/models';
import { Instrument, InstReqOptions, Exchange } from '../types';
import * as Okex from '../api/okex';
import * as Binance from '../api/binance';
import * as Bybit from '../api/bybit';
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
async function execJob(granularity: number, limit?: number) {
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
      return i.base_currency === 'BTC';
    } else {
      return i.quote_currency === 'USDT';
    }
  };

  const validInsts = sortBy(insts.filter(customFilter), ['instrument_id']);

  // 最近 4 条K线数据
  let count = limit || 4;

  if (minuteNow === 0 && granularity === Job_Granularity.FifteenMins) {
    count = 8;
  }

  // 每12h更新过去24h全量数据 (15mins, 1h)
  if (
    hourNow % 12 === 0 &&
    [Job_Granularity.FifteenMins, Job_Granularity.OneHour].includes(granularity)
  ) {
    count = getCountByHoursAgo(24, granularity);
  }

  await Promise.all([
    Okex.getHistoryKlines(
      validInsts.filter((i: any) => i.exchange === Exchange.Okex),
      {
        count,
        includeInterval: [granularity],
      },
    ),
    Binance.getHistoryKlines(
      validInsts.filter((i: any) => i.exchange === Exchange.Binance),
      {
        count,
        delay: 100,
        includeInterval: [granularity],
      },
    ),
    // Bybit.getHistoryKlines(
    //   validInsts.filter((i: any) => i.exchange === Exchange.Bybit),
    //   {
    //     count,
    //     delay: 200,
    //     includeInterval: [granularity],
    //   },
    // ),
  ]);
}

function getCommandOpts(args: any) {
  const opt: any = {};
  // param for instrument_id
  if (args.includes('-i') && args.length > args.indexOf('-i') + 1) {
    opt.includeInst = [args[args.indexOf('-i') + 1]];
  }

  // param for gran
  if (args.includes('-g') && args.length > args.indexOf('-g') + 1) {
    opt.includeInterval = [+args[args.indexOf('-g') + 1]];
  }

  // param for count
  if (args.includes('-n') && args.length > args.indexOf('-n') + 1) {
    opt.count = [+args[args.indexOf('-n') + 1]];
  }

  return opt;
}

export { Job_Granularity, execJob, getCommandOpts };
