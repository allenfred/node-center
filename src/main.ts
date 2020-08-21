import connectMongo from './database/connection';
import { startSchedule } from './schedule';
import logger from './logger';
import * as http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8000);

(async function main() {
  logger.info('-----crawler start-----');
  //连接数据库
  await connectMongo();
  // 开启定时任务获取历史K线
  startSchedule();
})();
