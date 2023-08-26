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
exports.setupWsClient = exports.broadCastTicker = exports.broadCastKline = void 0;
const publicClient_1 = require("../../lib/okex/publicClient");
const okex_node_1 = require("@okfe/okex-node");
const config_1 = require("../../config");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const util_1 = require("./util");
// 备注名 hunter
const API_KEY = '753285f2-3afb-402e-a468-9783c9ef7e5d';
const PRIVATE_KEY = '4E5CC0FBF38D85827A520D5446F911A7';
const pass_phrase = 'Qazwsx123=-';
const pClient = publicClient_1.default(config_1.OKEX_HTTP_HOST, 10000);
const client = pClient.swap();
const globalAny = global;
const OkxIntervalBar = {
    300: '5m',
    900: '15m',
    1800: '30m',
    3600: '1H',
    7200: '2H',
    14400: '4H',
    21600: '6H',
    43200: '12H',
    86400: '1D',
    604800: '1W',
};
function getSwapSubArgs(instruments) {
    return getBasicArgs(instruments);
}
function getBasicArgs(instruments) {
    const klineArgs = [];
    instruments.map((i) => {
        // 公共-K线频道
        // const subChannels = ['candle15m', 'candle1H', 'candle4H'];
        const subChannels = ['candle15m', 'candle1H'];
        subChannels.map((candleChannel) => {
            klineArgs.push({ channel: candleChannel, instId: i.instrument_id });
        });
    });
    // 公共-行情频道
    const tickerArgs = instruments.map((i) => {
        return { channel: 'tickers', instId: i.instrument_id };
    });
    return klineArgs.concat(tickerArgs);
}
/* V5 API payload:
{
  "arg": {
    "channel": "candle1D",
    "instId": "BTC-USDT-SWAP"
  },
  "data": [
    [
      "1629993600000",
      "42500",
      "48199.9",
      "41006.1",
      "41006.1",
      "3587.41204591",
      "166741046.22583129"
    ]
  ]
}
*/
function broadCastKline(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.arg.channel.includes('candle')) {
            const channel = util_1.getKlineSubChannel(msg.arg);
            const pubMsg = JSON.stringify({
                channel,
                data: msg.data[0],
            });
            globalAny.io.to('klines').emit(channel, pubMsg);
        }
    });
}
exports.broadCastKline = broadCastKline;
function broadCastTicker(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.arg.channel === 'tickers') {
            const pubMsg = JSON.stringify({
                channel: 'tickers',
                data: msg.data.map((i) => {
                    // [exchange, instrument_id, last, chg_24h, chg_rate_24h, volume_24h]
                    return [
                        types_1.Exchange.Okex,
                        i.instId,
                        i.last,
                        i.last - i.open24h,
                        (((i.last - i.open24h) * 100) / i.open24h).toFixed(4),
                        i.vol24h,
                    ];
                }),
            });
            globalAny.io.to('tickers').emit('tickers', pubMsg);
        }
    });
}
exports.broadCastTicker = broadCastTicker;
function setupWsClient() {
    return __awaiter(this, void 0, void 0, function* () {
        const wsClient = new okex_node_1.V3WebsocketClient(config_1.OKEX_WS_HOST);
        wsClient.connect();
        wsClient.on('open', () => __awaiter(this, void 0, void 0, function* () {
            globalAny.okexWsConnected = true;
            logger_1.default.info('!!! 与Okx wsserver建立连接成功 !!!');
            // wsClient.login(apikey, secret, passphrase);
            // const instruments: Instrument[] = await InstrumentInfoDao.find({
            //   exchange: Exchange.Okex,
            // });
            // 订阅永续频道信息
            // wsClient.subscribe(...getSwapSubArgs(instruments));
        }));
        wsClient.on('close', () => {
            logger_1.default.error('!!! 与Okx wsserver断开连接 !!!');
            wsClient.connect();
        });
        wsClient.on('message', (data) => {
            try {
                // logger.info(`!!! ws message =${data}`);
                const msg = JSON.parse(data);
                const eventType = msg.event;
                // if (eventType == 'login') {
                //   //登录消息
                //   if (obj?.success == true) {
                //     event.emit('login');
                //   }
                //   return;
                // }
                // 公共频道消息
                if (eventType == undefined) {
                    // broadCastByWS(obj, clients);
                    if (util_1.isKlineMsg(msg)) {
                        broadCastKline(msg);
                    }
                    if (util_1.isTickerMsg(msg)) {
                        broadCastTicker(msg);
                    }
                    // handleMsg(msg);
                }
            }
            catch (e) {
                logger_1.default.error('handleMessage catch err: ', e);
            }
        });
        return wsClient;
    });
}
exports.setupWsClient = setupWsClient;
//# sourceMappingURL=wsClient.js.map