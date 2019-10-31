const axios = require('axios');
const querystring = require('querystring');
import logger from '../logger';

export default function PublicClient(
  apiUri = 'https://www.okex.me',
  timeout = 3000,
  axiosConfig = {},
) {
  const axiosInstance = axios.default.create(
    Object.assign({ baseURL: apiUri, timeout }, axiosConfig),
  );
  async function get(url, params?) {
    try {
      return await axiosInstance.get(url, { params }).then(res => res.data);
    } catch (error) {
      return await axiosInstance
        .get(url, { params })
        .then(res => res.data)
        .catch(err => {
          return axiosInstance.get(url, { params }).then(res => res.data);
        });
    }
  }
  return {
    spot() {
      return {
        async getSpotInstruments() {
          return get('/api/spot/v3/instruments');
        },
        async getSpotBook(instrument_id, params) {
          return get(`/api/spot/v3/instruments/${instrument_id}/book`, params);
        },
        async getSpotTicker(instrument_id) {
          return instrument_id
            ? get(`/api/spot/v3/instruments/${instrument_id}/ticker`)
            : get('/api/spot/v3/instruments/ticker');
        },
        async getSpotTrade(instrument_id, params) {
          return get(
            `/api/spot/v3/instruments/${instrument_id}/trades`,
            params,
          );
        },
        async getSpotCandles(instrument_id, params) {
          return get(
            `/api/spot/v3/instruments/${instrument_id}/candles`,
            params,
          );
        },
      };
    },
    futures() {
      return {
        async getInstruments() {
          return get('/api/futures/v3/instruments');
        },
        async getBook(instrument_id, params) {
          return get(
            `/api/futures/v3/instruments/${instrument_id}/book${
              params ? `?${querystring.stringify(params)}` : ''
            }`,
          );
        },
        async getTicker(instrument_id) {
          return get(
            `/api/futures/v3/instruments${
              instrument_id ? `/${instrument_id}` : ''
            }/ticker`,
          );
        },
        async getTrades(instrument_id, params) {
          return get(
            `/api/futures/v3/instruments/${instrument_id}/trades${
              params ? `?${querystring.stringify(params)}` : ''
            }`,
          );
        },
        async getCandles(instrument_id, params) {
          return get(
            `/api/futures/v3/instruments/${instrument_id}/candles${
              params ? `?${querystring.stringify(params)}` : ''
            }`,
          );
        },
        async getIndex(instrument_id) {
          return get(`/api/futures/v3/instruments/${instrument_id}/index`);
        },
        async getRate() {
          return get('/api/futures/v3/rate');
        },
        async getEstimatedPrice(instrument_id) {
          return get(
            `/api/futures/v3/instruments/${instrument_id}/estimated_price`,
          );
        },
        async getOpenInterest(instrument_id) {
          return get(
            `/api/futures/v3/instruments/${instrument_id}/open_interest`,
          );
        },
        async getPriceLimit(instrument_id) {
          return get(
            `/api/futures/v3/instruments/${instrument_id}/price_limit`,
          );
        },
        async getLiquidation(instrument_id, params) {
          return get(
            `/api/futures/v3/instruments/${instrument_id}/liquidation?${querystring.stringify(
              params,
            )}`,
          );
        },
        async getMarkPrice(instrument_id) {
          return get(`/api/futures/v3/instruments/${instrument_id}/mark_price`);
        },
      };
    },
    swap() {
      return {
        async getInstruments() {
          return get('/api/swap/v3/instruments');
        },
        async getDepth(instrument_id, size) {
          return get(
            `/api/swap/v3/instruments/${instrument_id}/depth${
              size ? `?size=${size}` : ''
            }`,
          );
        },
        async getTicker(instrument_id) {
          return get(
            `/api/swap/v3/instruments${
              instrument_id ? `/${instrument_id}` : ''
            }/ticker`,
          );
        },
        async getTrades(instrument_id, params) {
          return get(
            `/api/swap/v3/instruments/${instrument_id}/trades${
              params ? `?${querystring.stringify(params)}` : ''
            }`,
          );
        },
        async getCandles(instrument_id, params) {
          return get(
            `/api/swap/v3/instruments/${instrument_id}/candles${
              params ? `?${querystring.stringify(params)}` : ''
            }`,
          );
        },
        async getIndex(instrument_id) {
          return get(`/api/swap/v3/instruments/${instrument_id}/index`);
        },
        async getRate() {
          return get('/api/swap/v3/rate');
        },
        async getOpenInterest(instrument_id) {
          return get(`/api/swap/v3/instruments/${instrument_id}/open_interest`);
        },
        async getPriceLimit(instrument_id) {
          return get(`/api/swap/v3/instruments/${instrument_id}/price_limit`);
        },
        async getLiquidation(instrument_id, params) {
          return get(
            `/api/swap/v3/instruments/${instrument_id}/liquidation`,
            params,
          );
        },
        async getFundingTime(instrument_id) {
          return get(`/api/swap/v3/instruments/${instrument_id}/funding_time`);
        },
        async getMarkPrice(instrument_id) {
          return get(`/api/swap/v3/instruments/${instrument_id}/mark_price`);
        },
        async getHistoricalFudingRate(instrument_id, params) {
          return get(
            `/api/swap/v3/instruments/${instrument_id}/historical_funding_rate`,
            params,
          );
        },
      };
    },
  };
}
