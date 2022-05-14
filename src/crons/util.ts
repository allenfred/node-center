import { getKlinesWithLimited } from '../api/common';
import { getTimestamp, getISOString } from '../util';
import { InstrumentInfo } from '../database/models';
import { Instrument, InstReqOptions, Exchange } from '../types';

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

  const swapOptions: InstReqOptions[] = insts
    .filter(customFilter)
    .map((i: Instrument) => {
      let candleCount = 10;

      if (granularity > Job_Granularity.TwoHour) {
        candleCount = 4;
      }

      return {
        // 最近 10 条K线数据
        start: getISOString((-candleCount * granularity) / 60, 'm'),
        end: new Date().toISOString(),
        granularity,
        instrument_id: i.instrument_id,
        exchange: i.exchange,
      } as InstReqOptions;
    });

  await getKlinesWithLimited(
    swapOptions.filter((i) => i.exchange === Exchange.Okex),
  );
  // await getKlinesWithLimited(
  //   swapOptions.filter((i) => i.exchange === Exchange.Biance),
  // );
}

export { Job_Granularity, execJob };
