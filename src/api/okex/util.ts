import {
  Exchange,
  OkxWsMsg,
  Instrument,
  KlineInterval,
  OkxInst,
  KlineReqOpts,
  OkxKline,
  InstKline,
  OkxWsKline,
  WsFormatKline,
} from '../../types';

export function isKlineMsg(message: any) {
  if (message && message.arg && message.arg.channel.includes('candle')) {
    return true;
  }
  return false;
}

export function isTickerMsg(message: any) {
  if (message && message.arg && message.arg.channel === 'tickers') {
    return true;
  }
  return false;
}

export function getKlineSubChannel(arg: { channel: string; instId: string }) {
  return `okex:candle${KlineInterval[arg.channel.toLowerCase()]}:${arg.instId}`;
}

export function isApiServer(req: any) {
  // console.log(ws._socket.address());
  try {
    return req && req.socket.remoteAddress == '121.4.15.211';
  } catch (e) {
    return false;
  }
}
