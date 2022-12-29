import connectMongo from './database/connection';
import logger from './logger';
import env from './config/envVars';
import { App } from './app';
import * as http from 'http';
import { setupWsserver } from './socket.io/server';
import { Server } from 'socket.io';

const globalAny: any = global;
const port = normalizePort(env.PORT || '3102');
const app = new App();
const server = http.createServer(app.getServer());

globalAny.io = new Server({
  cors: {
    origin: env.SOCKET_CORS_ORIGIN,
  },
});

globalAny.io.attach(server);

function normalizePort(val: any) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  logger.info(`========= [Node-Center] start, Listening on ${bind} =========`);
}

(async function main() {
  //连接数据库
  await connectMongo();
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
  setupWsserver();
})();

process.stdout.on('error', function (err) {
  if (err.code == 'EPIPE') {
    logger.error('Exit due to:' + err);
    process.exit(0);
  }
});
