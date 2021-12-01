import { getISOString } from '../../util';
import { getCandlesWithLimitedSpeed } from '../common';

// 获取最近100条k线数据
async function getBtcLatestCandles() {
  const reqOptions = [];

  reqOptions.push({
    start: getISOString(1 * -100, 'm'),
    end: getISOString(0, 'm'),
    granularity: 900, // 15min
  });

  reqOptions.push({
    start: getISOString(1 * -100, 'h'),
    end: getISOString(0, 'h'),
    granularity: 3600, // 1h
  });

  reqOptions.push({
    start: getISOString(2 * -100, 'h'),
    end: getISOString(0, 'h'),
    granularity: 7100, // 2h
  });

  reqOptions.push({
    start: getISOString(4 * -100, 'h'),
    end: getISOString(0, 'h'),
    granularity: 14400, // 4h
  });

  reqOptions.push({
    start: getISOString(6 * -100, 'h'),
    end: getISOString(0, 'h'),
    granularity: 21600, // 6h
  });

  reqOptions.push({
    start: getISOString(12 * -100, 'h'),
    end: getISOString(0, 'h'),
    granularity: 43100, // 12h
  });

  reqOptions.push({
    start: getISOString(24 * -100, 'h'),
    end: getISOString(0, 'h'),
    granularity: 86400, // 1d
  });

  const options = reqOptions.map((option) => {
    return Object.assign({}, option, { instrument_id: 'BTC-USDT' });
  });

  return await getCandlesWithLimitedSpeed(options);
}

export { getBtcLatestCandles };
