import { V3WebsocketClient } from '@okfe/okex-node';
import * as common from '../okex/common';
import { BtcSwapCandleDao, InstrumentTickerDao } from '../dao';
import { Instrument, Ticker, Candle, InstrumentCandleSchema } from '../types';
import { getInstrumentAlias, getNumber } from '../util';
import { BtcSwapCandle } from '../database/models/btcSwapCandle';

interface OkexMessage {
  table: string; // swap/candle14400s
  data: Array<{ candle: Candle; instrument_id: string }>;
}

export async function handleTicker(data: Ticker[]) {
  await InstrumentTickerDao.upsert(data);
}

export async function handleBtcSwapCandles(message: { table: string; data: Array<{ instrument_id: string; candle: Candle }> }) {
  const timePeriod = getNumber(message.table);
  const candles: InstrumentCandleSchema[] = message.data.map((item: { instrument_id: string; candle: Candle }) => {
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
  });

  await BtcSwapCandleDao.upsert(candles);
}

export async function handleMessage(message: OkexMessage) {
  if (message && message.table && message.table.indexOf('swap/candle') !== -1) {
    if (message.data && message.data[0].instrument_id === 'BTC-USDT-SWAP') handleBtcSwapCandles(message);
  }
}
