import { Exchange } from '../../../types';
import { getTimestamp } from '../../../util';
import { getKlinesWithLimited } from '../../common';

// 获取最近100条k线数据
async function getOkxBtcLatestKlines() {
  const reqOptions = [];

  reqOptions.push({
    start: getTimestamp(1 * -100, 'm'),
    end: getTimestamp(0, 'm'),
    granularity: 900, // 15min
  });

  reqOptions.push({
    start: getTimestamp(1 * -100, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 3600, // 1h
  });

  reqOptions.push({
    start: getTimestamp(2 * -100, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 7200, // 2h
  });

  reqOptions.push({
    start: getTimestamp(4 * -100, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 14400, // 4h
  });

  reqOptions.push({
    start: getTimestamp(6 * -100, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 21600, // 6h
  });

  reqOptions.push({
    start: getTimestamp(12 * -100, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 43200, // 12h
  });

  reqOptions.push({
    start: getTimestamp(24 * -100, 'h'),
    end: getTimestamp(0, 'h'),
    granularity: 86400, // 1d
  });

  const options = reqOptions.map((option) => {
    return Object.assign({}, option, { instrument_id: 'BTC-USDT' });
  });

  return await getKlinesWithLimited(
    options.map((opt: any) => {
      return Object.assign({}, opt, { exchange: Exchange.Okex });
    })
  );
}

export { getOkxBtcLatestKlines };
