import { InstrumentKlineDao, InstrumentTickerDao } from '../../dao';
import { Exchange, Ticker, OkexKline, InstrumentKlineSchema, KlineChannel } from '../../types';

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
  data: Array<OkexKline>;
}

export async function handleTicker(data: Ticker[]) {
  await InstrumentTickerDao.upsert(data);
}

export async function handleCandles(message: { arg: any; data: Array<OkexKline> }) {
  const granularity = KlineChannel[message.arg.channel];
  const instrumentId = message.arg.instId;

  const candles: InstrumentKlineSchema[] = message.data.map((candle: OkexKline) => {
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
      exchange: Exchange.Okex,
    };
  });

  await InstrumentKlineDao.upsert(candles);
}

function isBtcSwapCandle(instId: string) {
  return instId.indexOf('BTC') !== -1 && instId.indexOf('SWAP') !== -1;
}

function isUsdtSwapCandle(instId: string) {
  return instId.indexOf('USDT') !== -1 && instId.indexOf('SWAP') !== -1;
}

function isCandleChannelMsg(message: any) {
  if (message && message.arg && message.arg.channel.indexOf('candle') !== -1) {
    return true;
  }
  return false;
}

export async function handleMessage(message: OkexMessage) {
  if (!(new Date().getSeconds() === 0 || new Date().getSeconds() === 30)) {
    return;
  }

  if (isCandleChannelMsg(message)) {
    handleCandles(message);
  }
}
