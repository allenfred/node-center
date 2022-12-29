import { Exchange, Method, ClientWsMsg } from '../types';

const BINANCE_NUMBER_INTERVAL = {
  15: '15m',
  60: '1h',
  120: '2h',
  240: '4h',
  360: '6h',
  720: '12h',
  1440: '1d',
  10080: '1w',
};

const OKEX_NUMBER_INTERVAL = {
  15: '15m',
  60: '1H',
  120: '2H',
  240: '4H',
  360: '6H',
  7200: '12H',
  1440: '1D',
  10080: '1W',
};

export function isChannel(msg: ClientWsMsg, exchange: Exchange) {
  return JSON.stringify(msg).includes(exchange);
}

// Binance Interval:
// 1m 3m 5m 15m 30m
// 1h 2h 4h 6h 8h 12h
// 1d 3d
export function getBinanceWsKlineCommand(msg: string) {
  const [exchange, gran, instId] = msg.split('.');
  const channel = `${instId.toLowerCase()}@kline_${
    BINANCE_NUMBER_INTERVAL[gran]
  }`;

  return {
    channel,
    payload: JSON.stringify({
      method: Method.subscribe.toUpperCase(),
      params: [
        `${instId.toLowerCase()}@kline_${BINANCE_NUMBER_INTERVAL[gran]}`,
      ],
      id: new Date().getTime(),
    }),
  };
}

// Okex Interval:
// candle1D candle2D candle3D candle5D
// candle12H candle6H candle4H candle2H candle1H
// candle30m candle15m candle5m candle3m candle1m
export function getOkexWsKlineCommand(msg: string) {
  const [exchange, interval, instId] = msg.split('.');
  const channel = `candle${OKEX_NUMBER_INTERVAL[interval]}`;

  return {
    channel,
    payload: { channel, instId },
  };
}

// Bybit Interval:
// 1 3 5 15 30
// 60 120 240 360 720
// D W M
export function getBybitWsKlineCommand(msg: string) {
  const [exchange, interval, instId] = msg.split('.');
  const channel = `candle.${interval}.${instId.toUpperCase()}`;

  return {
    channel,
    payload: channel,
  };
}

export function getWsKlineCommand(msg: ClientWsMsg): {
  channel: string;
  payload: any;
} {
  try {
    const channel = getClientSubChannel(msg);

    if (channel.startsWith('binance')) {
      return getBinanceWsKlineCommand(channel);
    }

    if (channel.startsWith('okex')) {
      return getOkexWsKlineCommand(channel);
    }

    if (channel.startsWith('bybit')) {
      return getBybitWsKlineCommand(channel);
    }
  } catch (e) {
    return {} as any;
  }
}

export function getBinanceWsTickerCommands(msg: ClientWsMsg) {
  try {
    const { args: channnels } = msg;

    const params = channnels
      .filter((channel) => channel.startsWith('binance'))
      .map((channel) => {
        const parts = channel.split('.');
        return parts[1].toLowerCase() + '@ticker';
      });

    if (params.length) {
      return JSON.stringify({
        method: Method.subscribe.toUpperCase(),
        params,
        id: new Date().getTime(),
      });
    }

    return null;
  } catch (e) {
    return null;
  }
}

// ws.send('{"op": "subscribe", "args": ["instrument_info.100ms.BTCUSDT"]}')
export function getBybitWsTickerCommands(msg: ClientWsMsg) {
  try {
    const { args: channnels } = msg;

    return channnels
      .filter((channel) => channel.startsWith('bybit'))
      .map((channel) => {
        const parts = channel.split('.');
        return `instrument_info.100ms.${parts[1].toUpperCase()}`;
      });
  } catch (e) {
    return null;
  }
}

// {
//   "op": "subscribe",
//   "args": [{
//       "channel": "tickers",
//       "instId": "LTC-USD-200327"
//   }]
// }
export function getOkexWsTickerCommands(msg: ClientWsMsg) {
  try {
    const { args: channnels } = msg;

    return channnels
      .filter((channel) => channel.startsWith('okex'))
      .map((channel) => {
        const parts = channel.split('.');
        return {
          channel: 'tickers',
          instId: parts[1].toUpperCase(),
        };
      });
  } catch (e) {
    return null;
  }
}

export function getWsTickerCommands(msg: ClientWsMsg) {
  try {
    return {
      binance: getBinanceWsTickerCommands(msg),
      okex: getOkexWsTickerCommands(msg),
      bybit: getBybitWsTickerCommands(msg),
    };
  } catch (e) {
    return {};
  }
}

export function isSubscribeMsg({ op }: ClientWsMsg) {
  try {
    return op === Method.subscribe;
  } catch (e) {
    return false;
  }
}

export function isUnsubscribeMsg({ op }: ClientWsMsg) {
  try {
    return op === Method.unsubscribe;
  } catch (e) {
    return false;
  }
}

export function getClientSubChannel(msg: ClientWsMsg) {
  try {
    const { args } = msg;
    return args[0];
  } catch (e) {
    return '';
  }
}
