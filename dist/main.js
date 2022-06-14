"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./database/connection");
const logger_1 = require("./logger");
const http = require("http");
const server_1 = require("./wsserver/server");
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
});
server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(3002);
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('----- crypto-server start -----');
        //连接数据库
        yield connection_1.default();
        // await redisClient.connect();
        server_1.setupWsserver(server);
    });
})();
process.stdout.on('error', function (err) {
    if (err.code == 'EPIPE') {
        logger_1.default.error('Exit due to:' + err);
        process.exit(0);
    }
});
//# sourceMappingURL=main.js.map