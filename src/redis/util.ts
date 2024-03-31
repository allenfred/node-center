import client from '../redis/client';

export async function cacheCandlestickData(symbol: string, data: object) {
  const cacheKey = `candlestick:${symbol}`;
  client.setex(cacheKey, 60, JSON.stringify(data));
}
