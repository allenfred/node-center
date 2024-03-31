import { difference } from 'lodash';
import logger from '../logger';
import * as Binance from '../api/binance';
import * as Okex from '../api/okex';
import { Exchange, ClientWsMsg, EventName, Instrument } from '../types';
import { InstrumentInfoDao } from '../dao';
import {
  isChannel,
  isSubscribeMsg,
  getWsKlineCommand,
  getWsTickerCommands,
  getClientSubChannel,
} from './util';

interface ClientRefs {
  binance: any;
  bybit?: any;
  okex?: any;
}

const globalAny: any = global;

async function setupSocketServer(client: ClientRefs) {
  globalAny.binanceSubscribed = [];
  globalAny.okexSubscribed = [];

  globalAny.io.on('connection', (socket: any) => {
    logger.info('someone connected: ' + socket.id);

    socket.on('tickers', (msg: ClientWsMsg) => {
      const commands = getWsTickerCommands(msg);
      if (
        globalAny.okexWsConnected &&
        difference(commands.okex, globalAny.okexSubscribed).length
      ) {
        globalAny.okexSubscribed = [
          ...globalAny.okexSubscribed,
          ...commands.okex,
        ];
        client.okex.subscribe(...commands.okex);
      }

      socket.join('tickers');
      logger.info(`socket: [${socket.id}] join default room: [tickers]`);
    });

    socket.on('klines', (msg: ClientWsMsg) => {
      logger.info('[Event:klines] ' + JSON.stringify(msg));

      if (isSubscribeMsg(msg)) {
        const { channel, payload } = getWsKlineCommand(msg);

        socket.join('klines');
        socket.join(getClientSubChannel(msg));

        if (
          isChannel(msg, Exchange.Binance) &&
          globalAny.binanceWsConnected &&
          difference([channel], globalAny.binanceSubscribed).length
        ) {
          globalAny.binanceSubscribed = [
            ...globalAny.binanceSubscribed,
            ...difference([channel], globalAny.binanceSubscribed),
          ];

          client.binance.send(payload);
        }

        // ** client message schema:
        //   {
        //     "op": "subscribe",
        //     "args": [{
        //         "channel": "candle1h",
        //         "instId": "BTC-USDT-SWAP"
        //     }]
        //   }
        if (
          isChannel(msg, Exchange.Okex) &&
          globalAny.okexWsConnected &&
          difference([channel], globalAny.okexSubscribed).length
        ) {
          globalAny.okexSubscribed = [
            ...globalAny.okexSubscribed,
            ...difference([channel], globalAny.okexSubscribed),
          ];

          client.okex.subscribe(payload);
        }
      }

      logger.info(
        `socket: [${socket.id}] join room: [${getClientSubChannel(msg)}]`,
      );
    });

    // ** 默认每一个client只能订阅一个合约K线实时行情
    socket.on(EventName.disconnecting, () => {
      logger.info(
        `[disconnecting:${socket.id}] leave ${JSON.stringify(
          [...socket.rooms].filter((room) => room.includes('USDT')),
        )}`,
      );
    });

    socket.on(EventName.disconnect, (reason: string) => {
      logger.info(`[disconnect:${socket.id}]  reason: ${reason}`);
    });
  });
}

export async function setupWsserver() {
  const binanceInstruments: Instrument[] = await InstrumentInfoDao.find({
    exchange: Exchange.Binance,
  });

  const okexInstruments: Instrument[] = await InstrumentInfoDao.find({
    exchange: Exchange.Okex,
  });

  const binanceWsClient = await Binance.setupWsClient(binanceInstruments);
  const okexWsClient = await Okex.setupWsClient(okexInstruments);

  setupSocketServer({ binance: binanceWsClient, okex: okexWsClient });
}
