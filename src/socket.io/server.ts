import { difference } from 'lodash';
import logger from '../logger';
import * as Binance from '../api/binance';
import * as Bybit from '../api/bybit';
import * as Okex from '../api/okex';
import { Exchange, ReadyState, ClientWsMsg, EventName, Method } from '../types';
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
  globalAny.bybitSubscribed = [];
  globalAny.okexSubscribed = [];

  globalAny.io.on('connection', (socket: any) => {
    logger.info('someone connected: ' + socket.id);

    socket.on('tickers', (msg: ClientWsMsg) => {
      const commands = getWsTickerCommands(msg);
      // if (globalAny.binanceWsConnected && commands.binance) {
      //   client.binance.send(commands.binance);
      // }

      if (
        globalAny.bybitWsConnected &&
        difference(commands.bybit, globalAny.bybitSubscribed).length
      ) {
        globalAny.bybitSubscribed = [
          ...globalAny.bybitSubscribed,
          ...commands.bybit,
        ];
        client.bybit.subscribe(commands.bybit);
      }

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

        // ws.send('{"op":"subscribe","args":["candle.60.BTCUSDT"]}')
        if (
          isChannel(msg, Exchange.Bybit) &&
          globalAny.bybitWsConnected &&
          difference([channel], globalAny.bybitSubscribed).length
        ) {
          globalAny.bybitSubscribed = [
            ...globalAny.bybitSubscribed,
            ...difference([channel], globalAny.bybitSubscribed),
          ];

          client.bybit.subscribe(payload);
        }
      }

      logger.info(
        `socket: [${socket.id}] join room: [${getClientSubChannel(msg)}]`,
      );
    });

    // 默认每一个client只能订阅一个合约K线实时行情
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
  const binance = await Binance.setupWsClient();
  const okex = await Okex.setupWsClient();
  // const bybit = await Bybit.setupWsClient();

  setupSocketServer({ binance, okex });
}
