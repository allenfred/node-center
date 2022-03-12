const { Spot } = require('@binance/connector');
import { BianceExchangeInfoResponse, BianceSymbolInfo, BianceKline, KlineApiParams } from '../../types';
import logger from '../../logger';

const client = new Spot('', '', {
  baseURL: 'https://fapi.binance.com',
  wsURL: 'wss://fstream.binance.com', // If optional base URL is not provided, wsURL defaults to wss://stream.binance.com:9443
});

const callbacks = {
  open: () => {
    logger.info('open');
  },
  close: () => {
    logger.info('closed');
  },
  message: (data) => {
    logger.info(data);
  },
};

async function setupBianceWsClient() {
  // support combined stream, e.g.
  const combinedStreams = client.combinedStreams(['btcusdt@kline_1h', 'ethusdt@kline_1h'], callbacks);
}

async function getPerpetualInstruments(): Promise<Array<BianceSymbolInfo>> {
  return client
    .publicRequest('GET', '/fapi/v1/exchangeInfo', {})
    .then((res: { data: BianceExchangeInfoResponse }) => {
      console.log(res.data);
      return res.data.symbols.filter((i: BianceSymbolInfo) => i.contractType === 'PERPETUAL');
    })
    .catch((error: any) => {
      logger.error(error);
      return [];
    });
}

async function getKlines(params: KlineApiParams) {
  return client
    .publicRequest('GET', '/fapi/v1/klines', params)
    .then((res: { data: Array<BianceKline> }) => {
      return res.data;
    })
    .catch((error: any) => {
      logger.error(error);
      return [];
    });
}

export { client, getPerpetualInstruments, setupBianceWsClient, getKlines };
