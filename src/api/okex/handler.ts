import { InstrumentKlineDao, InstrumentTickerDao } from '../../dao';
import { Exchange, OkxWsMsg, OkxKlineChannel, OkxWsKline, InstKline } from '../../types';

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

export async function handleTickers(message: OkxWsMsg) {
  await InstrumentTickerDao.upsert(
    message.data.map((i) => {
      return {
        instrument_id: i.instId,
        last: i.last,
        best_ask: i.askPx,
        best_bid: i.bidPx,
        high_24h: i.high24h, // 24小时最高价
        low_24h: i.low24h, // 24小时最低价
        volume_24h: i.vol24h, // 24小时成交量（按张数统计）
        timestamp: i.ts, // 系统时间 ISO_8601
        open_interest: '0', // 持仓量
        open_24h: i.open24h, // 24小时开盘价
        volume_token_24h: i.volCcy24h, // 	成交量（按币统计）
        exchange: Exchange.Okex,
      };
    })
  );
}

export async function handleKlines(message: OkxWsMsg) {
  const granularity = OkxKlineChannel[message.arg.channel];
  const instrumentId = message.arg.instId;

  const klines: InstKline[] = message.data.map((kline: OkxWsKline) => {
    return {
      instrument_id: instrumentId,
      underlying_index: instrumentId.split('-')[0],
      quote_currency: instrumentId.split('-')[1],
      timestamp: new Date(+kline[0]),
      open: +kline[1],
      high: +kline[2],
      low: +kline[3],
      close: +kline[4],
      volume: +kline[5],
      currency_volume: +kline[6],
      granularity: +granularity,
      exchange: Exchange.Okex,
    };
  });

  await InstrumentKlineDao.upsert(klines);
}

function isKlineMsg(message: any) {
  if (message && message.arg && message.arg.channel.indexOf('candle') !== -1) {
    return true;
  }
  return false;
}

function isTickerMsg(message: any) {
  if (message && message.arg && message.arg.channel === 'tickers') {
    return true;
  }
  return false;
}

export async function handleMsg(message: OkxWsMsg) {
  if (!(new Date().getSeconds() % 10 === 0)) {
    return;
  }

  if (isKlineMsg(message)) {
    handleKlines(message);
  }

  if (isTickerMsg(message)) {
    handleTickers(message);
  }
}