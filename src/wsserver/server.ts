import { EventEmitter } from 'events';
import { V3WebsocketClient } from '@okfe/okex-node';
import { OKEX_WS_HOST } from '../config';
import logger from '../logger';
import { Channel, OkexWsMessage, Instrument, KlineChannel } from '../types';
import * as swap from '../api/okex/swap';
import * as common from '../api/okex/common';
import { handleMessage } from './../api/okex/handler';
import { InstrumentInfoDao } from '../dao';
import { setupBianceWsClient, initBianceInstruments } from '../api/biance';
import { setupOkexWsClient } from '../api/okex';

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

    ws.on('close', (e) => {
      console.log(e);
      logger.info('someone disconnected.');
    });
  });
}

export async function setupWsserver() {
  setupOkexWsClient(clients);
  // setupBianceWsClient();
  setupServer();
}
