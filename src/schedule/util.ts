import { getCandlesWithLimitedSpeed } from '../okex/common';
import * as futures from '../okex/futures';
import * as swap from '../okex/swap';
import { getInstrumentAlias, getISOString, isMainCurrency } from '../util';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
async function execJob(granularity: number) {
  // 获取所有合约信息
  const futuresInstruments = await futures.initInstruments();
  const swapInstruments = await swap.initInstruments();

  const futureOptions = futuresInstruments
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
  return await getCandlesWithLimitedSpeed(futureOptions.concat(swapOptions));
}

export { execJob };
