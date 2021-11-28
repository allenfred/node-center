import { BtcSwapCandleDao, InstrumentTickerDao } from '../dao';
import { Ticker, Candle, InstrumentCandleSchema } from '../types';
import { getInstrumentAlias } from '../util';

/* V5 API 
{
  "arg": {
    "channel": "candle1D",
    "instId": "BTC-USDT-SWAP"
  },
  "data": [
    [
      "1629993600000",
      "42500",
      "48199.9",
      "41006.1",
      "41006.1",
      "3587.41204591",
      "166741046.22583129"
    ]
  ]
} 
*/
interface OkexMessage {
  arg: any;
  data: Array<Candle>;
}

const candles = [
  'candle60s', // 1 min
  'candle180s', // 3 mins
  'candle300s', // 5 mins
  'candle900s', // 15 mins
  'candle1800s', // 30 mins
  'candle3600s', // 1 hour
  'candle7200s', // 2 hours
  'candle14400s', // 4 hours
  'candle21600s', // 6 hours
  'candle43200s', // 12 hours
  'candle86400s', // 1 day
  'candle604800s', // 1 week
];

enum CandleChannel {
  candle1W = 604800,
  candle1D = 86400,
  candle12H = 43200,
  candle6H = 21600,
  candle4H = 14400,
  candle2H = 7200,
  candle1H = 3600,
  candle30m = 1800,
  candle15m = 900,
}

export async function handleTicker(data: Ticker[]) {
  await InstrumentTickerDao.upsert(data);
}

export async function handleBtcSwapCandles(message: { arg: any; data: Array<Candle> }) {
  const granularity = CandleChannel[message.arg.channel];
  const instrumentId = message.arg.instId;
  const candles: InstrumentCandleSchema[] = message.data.map((candle: Candle) => {
    return {
      instrument_id: instrumentId,
      underlying_index: instrumentId.split('-')[0],
      quote_currency: instrumentId.split('-')[1],
      timestamp: new Date(+candle[0]),
      open: +candle[1],
      high: +candle[2],
      low: +candle[3],
      close: +candle[4],
      volume: +candle[5],
      currency_volume: +candle[6],
      granularity: +granularity,
    };
  });

  await BtcSwapCandleDao.upsert(candles);
}

function isCandleChannelMsg(message: any) {
  if (message && message.arg && message.arg.channel.indexOf('candle') !== -1) {
    return true;
  }
  return false;
}

export async function handleMessage(message: OkexMessage) {
  if (isCandleChannelMsg(message)) {
    if (message.arg.instId.indexOf('BTC') !== -1) handleBtcSwapCandles(message);
  }
}
