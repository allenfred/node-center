import { EventEmitter } from 'events';
import { V3WebsocketClient } from '@okfe/okex-node';
import { OKEX_WS_HOST } from '../config';
import logger from '../logger';
import { Channel, OkexWsMessage, Instrument, CandleChannel } from '../types';
import * as swap from '../okex/swap';
import * as common from '../okex/common';
import { handleMessage } from './handler';

const WebSocket = require('ws');
let wsServer: any;
const clients = [];

let wsClient: any;
const event = new EventEmitter();

interface Msg {
  event?: string;
  arg: any;
  data: any[];
}

// websocket 返回消息
function onMessage(data: any) {
  try {
    // logger.info(`!!! websocket message =${data}`);
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
      broadCastMessage(obj);
    }
  } catch (e) {
    logger.error('handleMessage catch err: ', e);
  }
}

async function subChannels() {
  logger.info('----- 与okex wsserver建立连接成功 -----');
  // wsClient.login(apikey, secret, passphrase);

  // 获取永续所有合约信息
  const swapInstruments: Instrument[] = await swap.initInstruments();
  // 指定BTC合约 及 其他USDT本位合约
  const subInstruments: Instrument[] = swapInstruments.filter((i) => i.underlying_index === 'BTC' || i.quote_currency === 'USDT');

  // 订阅永续频道信息
  wsClient.subscribe(...common.getSwapSubCommands(subInstruments));
}

function getChannelIndex(arg: any) {
  return `candle${[arg.channel]}:${arg.instId}`;
}

function broadCastMessage(msg: OkexWsMessage) {
  if (!clients.length) {
    return;
  }

  clients.map((client: any) => {
    if (client.channels.includes(getChannelIndex(msg.arg))) {
      client.send(JSON.stringify({ channel: getChannelIndex(msg.arg), data: msg.data }));
    }
  });
}

async function setupClient() {
  wsClient = new V3WebsocketClient(OKEX_WS_HOST);
  wsClient.connect();

  wsClient.on('open', subChannels);

  wsClient.on('close', () => {
    logger.info('WebSocket connection is closed, try to reconnect.');
    wsClient.connect();
  });

  wsClient.on('message', onMessage);
}

async function setupServer() {
  wsServer = new WebSocket.Server({ port: 8080 });

  wsServer.on('connection', function connection(ws: any) {
    ws.channels = [];
    clients.push(ws);
    ws.on('message', function incoming(message: any) {
      logger.info(`received: ${message}`);
      const data = JSON.parse(message);

      if (data.op === 'subscribe') {
        ws.channels = ws.channels.concat(data.args);
      }

      if (data.op === 'unsubscribe') {
        ws.channels = ws.channels.filter((channel: string) => !data.args.includes(channel));
      }
    });
  });
}

export async function setupWsserver() {
  setupClient();
  setupServer();
}
