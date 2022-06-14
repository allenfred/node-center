import logger from '../logger';
import * as Biance from '../api/biance';
import * as Okex from '../api/okex';

const WebSocket = require('ws');
let wsServer: any;
const clients = [];

enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

async function setupServer() {
  wsServer = new WebSocket.Server({ port: 8088 });

  // TODO: manager client ids request headers
  wsServer.on('connection', function connection(ws: any, req: any) {
    // console.log(ws._socket.address());
    // console.log(req.socket.remoteAddress);

    ws.channels = [];
    if (
      req.socket.remoteAddress.includes('121.4.15.211') ||
      req.socket.remoteAddress.includes('::1') ||
      req.socket.remoteAddress.includes('127.0.0.1')
    ) {
      ws.isApiServer = true;
      logger.info('connected from quant-api.');
    } else {
      ws.isApiServer = false;
      logger.info('connected from unknown client.');
    }

    clients.push(ws);

    ws.on('message', function incoming(message: any) {
      logger.info(`received: ${message}`);
      const data = JSON.parse(message);

      if (data.op === 'subscribe') {
        ws.channels = ws.channels.concat(data.args);
      }

      if (data.op === 'unsubscribe') {
        ws.channels = ws.channels.filter(
          (channel: string) => !data.args.includes(channel),
        );
      }
    });

    ws.on('close', () => {
      clients.find((e, i) => {
        if (e && e.readyState === ReadyState.CLOSED) {
          clients.splice(i, 1);
        }
      });

      logger.info('someone disconnected.');
    });
  });
}

export async function setupWsserver() {
  Okex.setupWsClient(clients);
  Biance.setupWsClient(clients);
  setupServer();
}
