import { EventEmitter } from 'events';
import { V3WebsocketClient } from '@okfe/okex-node';
import { OKEX_WS_HOST } from '../../config';
import logger from '../../logger';
import { Channel, OkexWsMessage, Instrument, KlineChannel } from '../../types';
import * as swap from '../../api/okex/swap';
import * as common from '../../api/okex/common';
import { handleMessage } from './handler';
import { InstrumentInfoDao } from '../../dao';

let wsClient: any;

interface Msg {
  event?: string;
  arg: any;
  data: any[];
}

async function subChannels() {
  logger.info('----- 与okex wsserver建立连接成功 -----');
  // wsClient.login(apikey, secret, passphrase);
  let instruments: Instrument[];

  if (new Date().getDay() === 1) {
    // 获取永续所有合约信息
    instruments = await swap.initInstruments();
    // 指定BTC合约 及 其他USDT本位合约
    instruments = instruments.filter((i) => i.underlying_index === 'BTC' || i.quote_currency === 'USDT');
  } else {
    instruments = await InstrumentInfoDao.findAll();
  }

  // 订阅永续频道信息
  wsClient.subscribe(...common.getSwapSubCommands(instruments));
}

function getChannelIndex(arg: any) {
  return `candle${KlineChannel[arg.channel]}:${arg.instId}`;
}

function broadCastMessage(msg: OkexWsMessage, clients: any[]) {
  if (!clients.length) {
    return;
  }

  clients.map((client: any) => {
    if (client.channels.includes(getChannelIndex(msg.arg))) {
      client.send(JSON.stringify({ channel: getChannelIndex(msg.arg), data: msg.data }));
    }
  });
}

async function setupOkexWsClient(clients: any[]) {
  wsClient = new V3WebsocketClient(OKEX_WS_HOST);
  wsClient.connect();

  wsClient.on('open', subChannels);

  wsClient.on('close', () => {
    logger.info('WebSocket connection is closed, try to reconnect.');
    wsClient.connect();
  });

  wsClient.on('message', (data: any) => {
    try {
      logger.info(`!!! websocket message =${data}`);
      var obj: Msg = JSON.parse(data);
      var eventType = obj.event;

      // if (eventType == 'login') {
      //   //登录消息
      //   if (obj?.success == true) {
      //     event.emit('login');
      //   }

      //   return;
      // }

      // channels 订阅消息
      if (eventType == undefined) {
        handleMessage(obj);
        broadCastMessage(obj, clients);
      }
    } catch (e) {
      logger.error('handleMessage catch err: ', e);
    }
  });
}

async function initOkexMarketMonitor(wsClient: any) {
  // 获取永续所有合约信息
  const swapInstruments = await swap.initInstruments();

  // 订阅永续所有频道信息
  wsClient.subscribe(...common.getSwapSubCommands(swapInstruments));
}

export { setupOkexWsClient, initOkexMarketMonitor };
