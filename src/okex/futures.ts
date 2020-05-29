import logger from "../logger";
import { Instrument } from "../types";
import { InstrumentInfoDao } from "../dao";
import { getCandleRequestOptions, isMainCurrency, getISOString } from "../util";
import { getCandlesWithLimitedSpeed, getFuturesInstruments } from "./common";

export async function initInstruments(): Promise<Instrument[]> {
  //获取全量交割合约信息
  const instruments: Array<Instrument> = await getFuturesInstruments();
  logger.info(
    `[交割合约] - 获取公共交割合约全量信息成功，共: ${instruments.length} 条 ...`
  );

  //更新合约信息
  await InstrumentInfoDao.upsert(instruments);
  logger.info(`[交割合约] - 公共交割合约全量信息更新数据库成功 ...`);

  return instruments;
}

export async function initCandle(instruments: Instrument[]): Promise<void> {
  //获取所有时间粒度请求参数 如[60/180/300 900/1800/3600/7200/14400/21600/43200/86400]
  const options: Array<{
    end: string;
    granularity: number;
  }> = getCandleRequestOptions();
  const readyOptions = [];

  //初始化所有合约candle请求参数
  instruments
    .filter((i) => isMainCurrency(i.underlying_index))
    .map((instrument: Instrument) => {
      for (let option of options) {
        readyOptions.push(Object.assign({}, option, instrument));
      }
    });

  logger.info(`获取合约candle数据需请求 ${readyOptions.length} 次 ...`);
  await getCandlesWithLimitedSpeed(readyOptions);
}

// 获取最多过去1440条k线数据
export async function getMaxCandles() {
  const reqOptions = [];
  for (let i = 0; i < 10; i++) {
    reqOptions.push({
      start: getISOString((i + 1) * -200, "h"),
      end: getISOString(i * -200, "h"),
      granularity: 3600, // 1h
    });

    reqOptions.push({
      start: getISOString((i + 1) * 2 * -200, "h"),
      end: getISOString(i * 2 * -200, "h"),
      granularity: 7200, // 2h
    });

    reqOptions.push({
      start: getISOString((i + 1) * 4 * -200, "h"),
      end: getISOString(i * 4 * -200, "h"),
      granularity: 14400, // 4h
    });

    reqOptions.push({
      start: getISOString((i + 1) * 6 * -200, "h"),
      end: getISOString(i * 6 * -200, "h"),
      granularity: 21600, // 6h
    });

    reqOptions.push({
      start: getISOString((i + 1) * 12 * -200, "h"),
      end: getISOString(i * 12 * -200, "h"),
      granularity: 43200, // 12h
    });

    reqOptions.push({
      start: getISOString((i + 1) * 24 * -200, "h"),
      end: getISOString(i * 24 * -200, "h"),
      granularity: 86400, // 1d
    });
  }

  return await getCandlesWithLimitedSpeed(reqOptions);
}
