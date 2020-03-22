import PublicClient from "./../publicClient";
import { httpHost } from "../../config";
import * as bluebird from "bluebird";
import logger from "../../logger";
import {
  Business,
  Instrument,
  Candle,
  InstrumentReqOptions
} from "../../types";
import { BtcUSDTCandleDao } from "../../dao";
import { getInstrumentAlias, getISOString, sleep } from "../../util";

const pClient = PublicClient(httpHost, 10000);

//获取合约K线数据
async function getCandles({
  instrumentId,
  start,
  end,
  granularity
}: {
  instrumentId: string;
  start: string;
  end: string;
  granularity: number;
}): Promise<Array<Candle>> {
  try {
    const data = await pClient
      .spot()
      .getSpotCandles(instrumentId, { start, end, granularity });
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

async function getCandlesByGroup(options: Array<InstrumentReqOptions>) {
  bluebird.map(
    options,
    async (option: InstrumentReqOptions) => {
      const data: Array<Candle> = await getCandles({
        instrumentId: "BTC-USDT",
        start: option.start,
        end: option.end,
        granularity: option.granularity
      });

      const readyCandles = data.map((candle: Candle) => {
        return {
          instrument_id: "BTC-USDT",
          timestamp: new Date(candle[0]),
          open: +candle[1],
          high: +candle[2],
          low: +candle[3],
          close: +candle[4],
          volume: +candle[5],
          granularity: option.granularity
        };
      });

      return await BtcUSDTCandleDao.upsert(readyCandles);
    },
    { concurrency: 5 }
  );
}

// 获取最多过去1440条k线数据
async function getBtcMaxCandles() {
  const reqOptions = [];
  for (let i = 0; i < 10; i++) {
    reqOptions.push({
      start: getISOString((i + 1) * 4 * -200, "h"),
      end: getISOString(i * 4 * -200, "h"),
      granularity: 14400 // 4h
    });

    reqOptions.push({
      start: getISOString((i + 1) * 6 * -200, "h"),
      end: getISOString(i * 6 * -200, "h"),
      granularity: 21600 // 6h
    });

    reqOptions.push({
      start: getISOString((i + 1) * 12 * -200, "h"),
      end: getISOString(i * 12 * -200, "h"),
      granularity: 43200 // 12h
    });

    reqOptions.push({
      start: getISOString((i + 1) * 24 * -200, "h"),
      end: getISOString(i * 24 * -200, "h"),
      granularity: 86400 // 1d
    });
  }

  return await getCandlesByGroup(reqOptions);
}

// 获取最近200条k线数据
async function getBtcLatestCandles() {
  const reqOptions = [];

  reqOptions.push({
    start: getISOString(4 * -200, "h"),
    end: getISOString(0, "h"),
    granularity: 14400 // 4h
  });

  reqOptions.push({
    start: getISOString(6 * -200, "h"),
    end: getISOString(0, "h"),
    granularity: 21600 // 6h
  });

  reqOptions.push({
    start: getISOString(12 * -200, "h"),
    end: getISOString(0, "h"),
    granularity: 43200 // 12h
  });

  reqOptions.push({
    start: getISOString(24 * -200, "h"),
    end: getISOString(0, "h"),
    granularity: 86400 // 1d
  });

  return await getCandlesByGroup(reqOptions);
}

export { getBtcMaxCandles, getBtcLatestCandles };
