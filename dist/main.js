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
const envVars_1 = require("./config/envVars");
const app_1 = require("./app");
const http = require("http");
const server_1 = require("./socket.io/server");
const socket_io_1 = require("socket.io");
const globalAny = global;
const port = normalizePort(envVars_1.default.PORT || '3102');
const app = new app_1.App();
const server = http.createServer(app.getServer());
globalAny.io = new socket_io_1.Server({
    cors: {
        origin: envVars_1.default.SOCKET_CORS_ORIGIN,
    },
});
globalAny.io.attach(server);
function normalizePort(val) {
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
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logger_1.default.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger_1.default.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    logger_1.default.info(`========= [Node-Center] start, Listening on ${bind} =========`);
}
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        //连接数据库
        yield connection_1.default();
        server.listen(port);
        server.on('error', onError);
        server.on('listening', onListening);
        server_1.setupWsserver();
    });
})();
process.stdout.on('error', function (err) {
    if (err.code == 'EPIPE') {
        logger_1.default.error('Exit due to:' + err);
        process.exit(0);
    }
});
//# sourceMappingURL=main.js.map