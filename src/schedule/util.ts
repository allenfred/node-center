import { getCandlesWithLimitedSpeed } from '../okex/common';
import * as swap from '../okex/swap';
import { getInstrumentAlias, getISOString, isMainCurrency } from '../util';

const Job_Granularity = {
  FiveMins: 60 * 5,
  FifteenMins: 60 * 15,
  HalfHour: 60 * 30,
  OneHour: 60 * 60,
  TwoHour: 60 * 120,
  FourHour: 60 * 240,
  OneDay: 60 * 1440,
};

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
async function execJob(granularity: number) {
  // 获取所有合约信息
  const swapInstruments = await swap.initInstruments();

  const swapOptions = swapInstruments
    // .filter((i) => ['BTC', 'ETH', 'LTC'].includes(i.underlying_index))
    .filter((i) => ['BTC'].includes(i.underlying_index))
    .map((i) => {
      return Object.assign({}, i, {
        start: getISOString((-200 * granularity) / 60, 'm'),
        end: new Date().toISOString(),
        granularity,
        alias: getInstrumentAlias(i.instrument_id),
      });
    });

  return await getCandlesWithLimitedSpeed(swapOptions);
}

export { Job_Granularity, execJob };
