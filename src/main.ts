import connectMongo from './database/connection';
import logger from './logger';
import * as http from 'http';
import { setupWsserver } from './wsserver/server';
import redisClient from './redis/client';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(3002);

(async function main() {
  logger.info('----- crypto-server start -----');
  //连接数据库
  await connectMongo();
  // await redisClient.connect();
  setupWsserver(server);
})();

process.stdout.on('error', function (err) {
  if (err.code == 'EPIPE') {
    logger.error('Exit due to:' + err);
    process.exit(0);
  }
});
