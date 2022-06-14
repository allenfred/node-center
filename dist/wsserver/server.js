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
exports.setupWsserver = void 0;
const logger_1 = require("../logger");
const Biance = require("../api/biance");
const Okex = require("../api/okex");
const WebSocket = require('ws');
let wsServer;
const clients = [];
var ReadyState;
(function (ReadyState) {
    ReadyState[ReadyState["CONNECTING"] = 0] = "CONNECTING";
    ReadyState[ReadyState["OPEN"] = 1] = "OPEN";
    ReadyState[ReadyState["CLOSING"] = 2] = "CLOSING";
    ReadyState[ReadyState["CLOSED"] = 3] = "CLOSED";
})(ReadyState || (ReadyState = {}));
function setupServer() {
    return __awaiter(this, void 0, void 0, function* () {
        wsServer = new WebSocket.Server({ port: 8080 });
        // TODO: manager client ids request headers
        wsServer.on('connection', function connection(ws, req) {
            // console.log(ws._socket.address());
            // console.log(req.socket.remoteAddress);
            ws.channels = [];
            if (req.socket.remoteAddress.includes('121.4.15.211') ||
                req.socket.remoteAddress.includes('::1') ||
                req.socket.remoteAddress.includes('127.0.0.1')) {
                ws.isApiServer = true;
                logger_1.default.info('connected from quant-api.');
            }
            else {
                ws.isApiServer = false;
                logger_1.default.info('connected from unknown client.');
            }
            clients.push(ws);
            ws.on('message', function incoming(message) {
                logger_1.default.info(`received: ${message}`);
                const data = JSON.parse(message);
                if (data.op === 'subscribe') {
                    ws.channels = ws.channels.concat(data.args);
                }
                if (data.op === 'unsubscribe') {
                    ws.channels = ws.channels.filter((channel) => !data.args.includes(channel));
                }
            });
            ws.on('close', () => {
                clients.find((e, i) => {
                    if (e && e.readyState === ReadyState.CLOSED) {
                        clients.splice(i, 1);
                    }
                });
                logger_1.default.info('someone disconnected.');
            });
        });
    });
}
function setupWsserver() {
    return __awaiter(this, void 0, void 0, function* () {
        Okex.setupWsClient(clients);
        Biance.setupWsClient(clients);
        setupServer();
    });
}
exports.setupWsserver = setupWsserver;
//# sourceMappingURL=server.js.map