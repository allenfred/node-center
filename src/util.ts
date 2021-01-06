import * as moment from 'moment';
import { Channel, Ticker, PriceRange, MarkPrice, Depth, Trade } from './types';

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
    { start: getISOString(-200 * size, 'm'), end: getISOString() },
    {
      start: getISOString(-400 * size, 'm'),
      end: getISOString(-200 * size, 'm'),
    },
    {
      start: getISOString(-600 * size, 'm'),
      end: getISOString(-400 * size, 'm'),
    },
    {
      start: getISOString(-800 * size, 'm'),
      end: getISOString(-600 * size, 'm'),
    },
    {
      start: getISOString(-1000 * size, 'm'),
      end: getISOString(-800 * size, 'm'),
    },
    {
      start: getISOString(-1200 * size, 'm'),
      end: getISOString(-1000 * size, 'm'),
    },
    {
      start: getISOString(-1400 * size, 'm'),
      end: getISOString(-1200 * size, 'm'),
    },
    {
      start: getISOString(-1600 * size, 'm'),
      end: getISOString(-1400 * size, 'm'),
    },
    {
      start: getISOString(-1800 * size, 'm'),
      end: getISOString(-1600 * size, 'm'),
    },
    {
      start: getISOString(-2000 * size, 'm'),
      end: getISOString(-1800 * size, 'm'),
    },
  ].map((option) => {
    return Object.assign({}, option, {
      granularity: 60 * size,
    });
  });
}

export function getCandleRequestOptions() {
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
export function refreshTradeInfo(memoryData: Array<Ticker | PriceRange | MarkPrice | Depth | Trade>, marketData) {
  const ticker = memoryData.find(({ instrument_id }) => {
    return instrument_id === marketData.data[0].instrument_id;
  });
  let data = marketData.data[0];
  if (ticker) {
    memoryData.map((item: Ticker | PriceRange | MarkPrice) => {
      if (ticker.instrument_id === item.instrument_id) {
        Object.assign(item, data);
      }
    });
  } else {
    memoryData.push(data);
  }
}
