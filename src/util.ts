import * as moment from 'moment';
import { OkxKlineChannel, OkxWsTicker } from './types';

export async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export function getInstrumentAlias(instrumentId: string): string {
  if (instrumentId.includes('SWAP')) {
    return 'swap';
  }

  const thisWeek = moment().day(5).format('YYMMDD');
  const nextWeek = moment().day(12).format('YYMMDD');

  if (instrumentId.includes(thisWeek)) {
    return 'this_week';
  }

  if (instrumentId.includes(nextWeek)) {
    return 'next_week';
  }

  return 'quarter';
}

function getStartEndOptions(size: number) {
  return [
    { start: getTimestamp(-200 * size, 'm'), end: getTimestamp() },
    {
      start: getTimestamp(-400 * size, 'm'),
      end: getTimestamp(-200 * size, 'm'),
    },
    {
      start: getTimestamp(-600 * size, 'm'),
      end: getTimestamp(-400 * size, 'm'),
    },
    {
      start: getTimestamp(-800 * size, 'm'),
      end: getTimestamp(-600 * size, 'm'),
    },
    {
      start: getTimestamp(-1000 * size, 'm'),
      end: getTimestamp(-800 * size, 'm'),
    },
    {
      start: getTimestamp(-1200 * size, 'm'),
      end: getTimestamp(-1000 * size, 'm'),
    },
    {
      start: getTimestamp(-1400 * size, 'm'),
      end: getTimestamp(-1200 * size, 'm'),
    },
    {
      start: getTimestamp(-1600 * size, 'm'),
      end: getTimestamp(-1400 * size, 'm'),
    },
    {
      start: getTimestamp(-1800 * size, 'm'),
      end: getTimestamp(-1600 * size, 'm'),
    },
    {
      start: getTimestamp(-2000 * size, 'm'),
      end: getTimestamp(-1800 * size, 'm'),
    },
  ].map((option) => {
    return Object.assign({}, option, {
      granularity: 60 * size,
    });
  });
}

export function getKlineReqOptions() {
  const oneMinute = getStartEndOptions(1);
  const threeMinutes = getStartEndOptions(3);
  const fiveMinutes = getStartEndOptions(5);
  const fifteenMinutes = getStartEndOptions(15);
  const thirtyMinutes = getStartEndOptions(30);
  const oneHour = getStartEndOptions(60);
  const twoHours = getStartEndOptions(120);
  const fourHours = getStartEndOptions(240);
  const sixHours = getStartEndOptions(360);
  const twelveHours = getStartEndOptions(720);
  const day = getStartEndOptions(1440);

  return oneMinute
    .concat(threeMinutes)
    .concat(fiveMinutes)
    .concat(fifteenMinutes)
    .concat(thirtyMinutes)
    .concat(oneHour)
    .concat(twoHours)
    .concat(fourHours)
    .concat(sixHours)
    .concat(twelveHours)
    .concat(day);
}

export function getISOString(amount: number = 0, unit: moment.DurationInputArg2 = 'm') {
  return moment().add(amount, unit).toISOString();
}

export function getTimestamp(amount: number = 0, unit: moment.DurationInputArg2 = 'm'): any {
  return +moment().add(amount, unit);
}

export function isValidMarketData(marketData): Boolean {
  return !!('data' in marketData && marketData.data.length > 0);
}

export function isCandleChannel(channel: string): Boolean {
  return !!(channel && channel.includes('candle'));
}

export function isMainCurrency(name: string) {
  return ['BTC', 'LTC', 'ETH'].includes(name);
}

//更新实时盘口信息
export function refreshOkxTradeInfo(memoryData: Array<any>, marketData) {
  const ticker = memoryData.find(({ instrument_id }) => {
    return instrument_id === marketData.data[0].instrument_id;
  });
  let data = marketData.data[0];
  if (ticker) {
    memoryData.map((item: any) => {
      if (ticker.instrument_id === item.instrument_id) {
        Object.assign(item, data);
      }
    });
  } else {
    memoryData.push(data);
  }
}

export function getNumber(str: string) {
  return str.match(/\d+/)[0];
}
