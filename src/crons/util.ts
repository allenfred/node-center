import { getCandlesWithLimitedSpeed } from '../okex/common';
import { getISOString } from '../util';
import { InstrumentInfo } from '../database/models';
import { Instrument, InstrumentReqOptions } from '../types';

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
  // const swapInstruments = await swap.initInstruments();
  const swapInstruments: Instrument[] = await InstrumentInfo.find({});

  const customFilter = (i: Instrument) => {
    if (granularity === 300) {
      return i.underlying_index === 'BTC';
    } else {
      return i.underlying_index === 'BTC' || i.quote_currency === 'USDT';
    }
  };

  const swapOptions: InstrumentReqOptions[] = swapInstruments.filter(customFilter).map((i: Instrument) => {
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
    } as InstrumentReqOptions;
  });

  return await getCandlesWithLimitedSpeed(swapOptions);
}

export { Job_Granularity, execJob };