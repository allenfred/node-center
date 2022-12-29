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
exports.handleMsg = exports.getKlineSubChannel = exports.isKlineFinish = exports.isKlineMsg = exports.isTickerMsg = void 0;
const types_1 = require("../../types");
function isTickerMsg(message) {
    if (JSON.stringify(message).includes('Ticker')) {
        return true;
    }
    return false;
}
exports.isTickerMsg = isTickerMsg;
function isKlineMsg(message) {
    if (message.e === 'kline') {
        return true;
    }
    return false;
}
exports.isKlineMsg = isKlineMsg;
function isKlineFinish(message) {
    if (message.k.x) {
        return true;
    }
    return false;
}
exports.isKlineFinish = isKlineFinish;
function getKlineSubChannel(interval, instId) {
    return `binance.${types_1.KlineInterval['candle' + interval]}.${instId}`;
}
exports.getKlineSubChannel = getKlineSubChannel;
// export async function handleTickerWsMsg(message: BinanceWsMsg) {
//   await InstrumentInfoDao.upsert(
//     message.data
//       .filter((i) => i.s.endsWith('USDT'))
//       .map((i: BinanceWsMiniTicker) => {
//         return {
//           instrument_id: i.s, // symbol
//           last: i.c, // 最新成交价格
//           // chg_24h: i.p, // 24小时价格变化
//           chg_24h: +i.c - +i.o, // 24小时价格变化
//           // chg_rate_24h: i.P, // 24小时价格变化(百分比)
//           chg_rate_24h: (((+i.c - +i.o) * 100) / +i.o).toFixed(4), // 24小时价格变化(百分比)
//           high_24h: i.h, // 24小时最高价
//           low_24h: i.l, // 24小时最低价
//           volume_24h: i.q, // 24小时成交量（按张数统计）
//           timestamp: i.E, // 系统时间 ISO_8601
//           open_interest: '', // 持仓量
//           open_24h: i.o, // 24小时开盘价
//           volume_token_24h: i.v, // 	成交量（按币统计）
//           exchange: Exchange.Binance,
//         } as any;
//       }),
//   );
// }
// export async function handleKlineWsMsg(msg: BinanceWsKlineMsg) {
//   const k: BinanceWsKline = msg.data['k'];
//   await InstrumentKlineDao.upsertOne({
//     instrument_id: k.s,
//     underlying_index: k.s.replace('USDT', ''),
//     quote_currency: 'USDT',
//     timestamp: k.t,
//     open: +k.o,
//     high: +k.h,
//     low: +k.l,
//     close: +k.c,
//     volume: +k.v, // 成交量
//     currency_volume: +k.q, // 成交额 以USDT计价
//     granularity: KlineInterval['candle' + k.i],
//     exchange: Exchange.Binance,
//   });
// }
function handleMsg(message) {
    return __awaiter(this, void 0, void 0, function* () {
        // 每15min更新一次Ticker
        // if (
        //   isTickerMsg(message) &&
        //   new Date().getMinutes() % 10 === 0 &&
        //   new Date().getSeconds() < 30
        // ) {
        //   handleTickerWsMsg(message);
        // }
        // console.log(message);
        // 当K线完结 更新K线数据`
        // if (isKlineMsg(message)) {
        //   handleKlineWsMsg(message);
        // }
    });
}
exports.handleMsg = handleMsg;
//# sourceMappingURL=util.js.map