import { V3WebsocketClient } from '@okfe/okex-node';
import * as common from '../okex/common';
import {
  InstrumentInfoDao,
  InstrumentTickerDao,
  InstrumentCandleDao,
} from '../dao';
import { Instrument, Ticker, Candle, InstrumentCandleSchema } from '../types';
import { getInstrumentAlias } from '../util';

export async function handleFutureInstruments(
  wss: V3WebsocketClient,
  data: Instrument[],
) {
  await InstrumentInfoDao.upsert(data);
  wss.subscribe(...common.getFuturesSubCommands(data));
}

export async function handleTicker(data: Ticker[]) {
  await InstrumentTickerDao.upsert(data);
}

export async function handleCandles(message: {
  table: string;
  data: Array<{ instrument_id: string; candle: Candle }>;
}) {
  const timePeriod = getNumber(message.table);
  const candles: InstrumentCandleSchema[] = message.data.map(
    (item: { instrument_id: string; candle: Candle }) => {
      return {
        instrument_id: item.instrument_id,
        underlying_index: item.instrument_id.split('-')[0],
        quote_currency: item.instrument_id.split('-')[1],
        timestamp: new Date(item.candle[0]),
        open: +item.candle[1],
        high: +item.candle[2],
        low: +item.candle[3],
        close: +item.candle[4],
        volume: +item.candle[5],
        currency_volume: +item.candle[6],
        alias: getInstrumentAlias(item.instrument_id),
        granularity: +timePeriod,
      };
    },
  );

  await InstrumentCandleDao.upsert(candles);
}

export function getNumber(str: string) {
  return str.match(/\d+/)[0];
}
