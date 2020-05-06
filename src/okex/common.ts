import PublicClient from "./publicClient";
import { httpHost } from "../config";
import * as bluebird from "bluebird";
import logger from "../logger";
import { Business, Instrument, Candle, InstrumentReqOptions } from "../types";
import { InstrumentCandleDao } from "../dao";
import {
  sleep,
  getISOString,
  isMainCurrency,
  getInstrumentAlias,
} from "../util";
import * as futures from "../okex/futures";
import * as swap from "../okex/swap";

const pClient = PublicClient(httpHost, 10000);
const candles = [
  "candle60s", // 1 min
  "candle180s", // 3 mins
  "candle300s", // 5 mins
  "candle900s", // 15 mins
  "candle1800s", // 30 mins
  "candle3600s", // 1 hour
  "candle7200s", // 2 hours
  "candle14400s", // 4 hours
  "candle21600s", // 6 hours
  "candle43200s", // 12 hours
  "candle86400s", // 1 day
  "candle604800s", // 1 week
];

async function getFuturesInstruments(): Promise<any> {
  return pClient.futures().getInstruments();
}

async function getSwapInstruments(): Promise<any> {
  return pClient.swap().getInstruments();
}

//获取合约K线数据
async function getCandles({
  instrumentId,
  start,
  end,
  granularity,
}: {
  instrumentId: string;
  start: string;
  end: string;
  granularity: number;
}): Promise<Array<Candle>> {
  try {
    const data = instrumentId.includes("SWAP")
      ? await pClient
          .swap()
          .getCandles(instrumentId, { start, end, granularity })
      : await pClient
          .futures()
          .getCandles(instrumentId, { start, end, granularity });
    logger.info(
      `获取 ${instrumentId}/${granularity} K线成功: 从${start}至${end}, 共 ${data.length} 条`
    );
    return data;
  } catch (e) {
    logger.error(
      `获取 ${instrumentId}/${granularity} K线失败: 从${start}至${end}`
    );
    return [];
  }
}

function getSwapSubCommands(instruments: Instrument[]): Array<string> {
  return getBasicCommands(instruments, Business.SWAP);
}

function getFuturesSubCommands(instruments: Instrument[]): Array<string> {
  return getBasicCommands(instruments, Business.FUTURES);
}

//指令格式:<business>/<channel>:<filter>
function getBasicCommands(
  instruments: Instrument[],
  business: Business
): Array<string> {
  //公共Ticker频道
  const tickerChannels = instruments.map((i: Instrument) => {
    return `${business}/ticker:${i.instrument_id}`;
  });

  //公共-K线频道
  const candleChannels = [];
  instruments.map((i: Instrument) => {
    candles.map((candle) => {
      candleChannels.push(`${business}/${candle}:${i.instrument_id}`);
    });
  });

  //公共-交易频道
  const tradeChannels = instruments.map((i: Instrument) => {
    return `${business}/trade:${i.instrument_id}`;
  });

  //公共-限价频道
  const priceRangeChannels = instruments.map((i: Instrument) => {
    return `${business}/price_range:${i.instrument_id}`;
  });

  //公共-200档深度频道
  const depthChannels = instruments.map((i: Instrument) => {
    return `${business}/depth:${i.instrument_id}`;
  });

  //公共-标记价格频道
  const markPriceChannels = instruments.map((i: Instrument) => {
    return `${business}/mark_price:${i.instrument_id}`;
  });

  return (
    tickerChannels
      .concat(candleChannels)
      .concat(tradeChannels)
      .concat(priceRangeChannels)
      // .concat(depthChannels)
      .concat(markPriceChannels)
  );
}

async function getCandlesByGroup(options: Array<InstrumentReqOptions>) {
  bluebird.map(
    options,
    async (option: InstrumentReqOptions) => {
      const data: Array<Candle> = await getCandles({
        instrumentId: option.instrument_id,
        start: option.start,
        end: option.end,
        granularity: option.granularity,
      });

      const readyCandles = data.map((candle: Candle) => {
        return {
          instrument_id: option.instrument_id,
          underlying_index: option.underlying_index,
          quote_currency: option.quote_currency,
          timestamp: new Date(candle[0]),
          open: +candle[1],
          high: +candle[2],
          low: +candle[3],
          close: +candle[4],
          volume: +candle[5],
          currency_volume: +candle[6],
          alias: option.alias,
          granularity: option.granularity,
        };
      });

      return await InstrumentCandleDao.upsert(readyCandles);
    },
    { concurrency: 5 }
  );
}

async function getCandlesWithLimitedSpeed(
  options: Array<InstrumentReqOptions>
) {
  //设置系统限速规则: 10次/2s (okex官方API 限速规则：20次/2s)
  const groupCount = Math.round(options.length / 10);
  let start = 0;
  await bluebird.map(
    new Array(groupCount).fill(null),
    async () => {
      await getCandlesByGroup(options.slice(start, start + 10));
      start += 10;
      return sleep(2);
    },
    { concurrency: 1 }
  );
}

// 获取最多过去1440条k线数据
async function getBtcFutureMaxCandles() {
  // 获取所有合约信息
  let futuresInstruments = await futures.initInstruments();
  futuresInstruments = futuresInstruments.filter(
    (i) =>
      isMainCurrency(i.underlying_index) &&
      isMainCurrency(i.settlement_currency)
  );

  const reqOptions = [];
  for (let i = 0; i < 10; i++) {
    futuresInstruments.forEach((instrument) => {
      reqOptions.push(
        Object.assign({}, instrument, {
          start: getISOString((i + 1) * -200, "h"),
          end: getISOString(i * -200, "h"),
          granularity: 3600, // 1h
        })
      );

      reqOptions.push(
        Object.assign({}, instrument, {
          start: getISOString((i + 1) * 4 * -200, "h"),
          end: getISOString(i * 4 * -200, "h"),
          granularity: 14400, // 4h
        })
      );

      reqOptions.push(
        Object.assign({}, instrument, {
          start: getISOString((i + 1) * 6 * -200, "h"),
          end: getISOString(i * 6 * -200, "h"),
          granularity: 21600, // 6h
        })
      );

      reqOptions.push(
        Object.assign({}, instrument, {
          start: getISOString((i + 1) * 12 * -200, "h"),
          end: getISOString(i * 12 * -200, "h"),
          granularity: 43200, // 12h
        })
      );

      reqOptions.push(
        Object.assign({}, instrument, {
          start: getISOString((i + 1) * 24 * -200, "h"),
          end: getISOString(i * 24 * -200, "h"),
          granularity: 86400, // 1d
        })
      );
    });
  }

  return await getCandlesWithLimitedSpeed(reqOptions);
}

// 获取最多过去1440条k线数据
async function getBtcSwapMaxCandles() {
  // 币本位合约
  let instruments = await swap.initInstruments();
  const instrument = instruments.find(
    (i) => i.instrument_id === "BTC-USD-SWAP"
  );

  const reqOptions = [];
  for (let i = 0; i < 10; i++) {
    reqOptions.push(
      Object.assign({}, instrument, {
        start: getISOString((i + 1) * -200, "m"),
        end: getISOString(i * -200, "m"),
        granularity: 60, // 1m
      })
    );

    reqOptions.push(
      Object.assign({}, instrument, {
        start: getISOString((i + 1) * 3 * -200, "m"),
        end: getISOString(i * 3 * -200, "m"),
        granularity: 180, // 3m
      })
    );

    reqOptions.push(
      Object.assign({}, instrument, {
        start: getISOString((i + 1) * -200, "h"),
        end: getISOString(i * -200, "h"),
        granularity: 3600, // 1h
      })
    );

    reqOptions.push(
      Object.assign({}, instrument, {
        start: getISOString((i + 1) * 4 * -200, "h"),
        end: getISOString(i * 4 * -200, "h"),
        granularity: 14400, // 4h
      })
    );

    reqOptions.push(
      Object.assign({}, instrument, {
        start: getISOString((i + 1) * 6 * -200, "h"),
        end: getISOString(i * 6 * -200, "h"),
        granularity: 21600, // 6h
      })
    );

    reqOptions.push(
      Object.assign({}, instrument, {
        start: getISOString((i + 1) * 12 * -200, "h"),
        end: getISOString(i * 12 * -200, "h"),
        granularity: 43200, // 12h
      })
    );

    reqOptions.push(
      Object.assign({}, instrument, {
        start: getISOString((i + 1) * 24 * -200, "h"),
        end: getISOString(i * 24 * -200, "h"),
        granularity: 86400, // 1d
      })
    );
  }

  return await getCandlesWithLimitedSpeed(reqOptions);
}

// 获取最近200条k线数据
async function getBtcSwapLatestCandles() {
  // 币本位合约
  let instruments = await swap.initInstruments();
  const instrument = instruments.find(
    (i) => i.instrument_id === "BTC-USD-SWAP"
  );

  const reqOptions = [];

  reqOptions.push(
    Object.assign({}, instrument, {
      instrument_id: "BTC-USD-SWAP",
      start: getISOString(1 * -200, "m"),
      end: getISOString(0, "m"),
      granularity: 60, // 1min
    })
  );

  reqOptions.push(
    Object.assign({}, instrument, {
      instrument_id: "BTC-USD-SWAP",
      start: getISOString(3 * -200, "m"),
      end: getISOString(0, "m"),
      granularity: 180, // 3min
    })
  );

  reqOptions.push(
    Object.assign({}, instrument, {
      instrument_id: "BTC-USD-SWAP",
      start: getISOString(1 * -200, "h"),
      end: getISOString(0, "h"),
      granularity: 3600, // 1h
    })
  );

  reqOptions.push(
    Object.assign({}, instrument, {
      instrument_id: "BTC-USD-SWAP",
      start: getISOString(4 * -200, "h"),
      end: getISOString(0, "h"),
      granularity: 14400, // 4h
    })
  );

  reqOptions.push(
    Object.assign({}, instrument, {
      instrument_id: "BTC-USD-SWAP",
      start: getISOString(6 * -200, "h"),
      end: getISOString(0, "h"),
      granularity: 21600, // 6h
    })
  );

  reqOptions.push(
    Object.assign({}, instrument, {
      instrument_id: "BTC-USD-SWAP",
      start: getISOString(12 * -200, "h"),
      end: getISOString(0, "h"),
      granularity: 43200, // 12h
    })
  );

  reqOptions.push(
    Object.assign({}, instrument, {
      instrument_id: "BTC-USD-SWAP",
      start: getISOString(24 * -200, "h"),
      end: getISOString(0, "h"),
      granularity: 86400, // 1d
    })
  );

  return await getCandlesByGroup(reqOptions);
}

export {
  getSwapInstruments,
  getFuturesInstruments,
  getCandles,
  getCandlesWithLimitedSpeed,
  getCandlesByGroup,
  getBasicCommands,
  getSwapSubCommands,
  getFuturesSubCommands,
  getBtcFutureMaxCandles,
  getBtcSwapMaxCandles,
  getBtcSwapLatestCandles,
};
