// tslint:disable:variable-name
import axios from 'axios';
import * as querystring from 'querystring';
export function PublicClient(apiUri = 'https://www.okex.com', timeout = 3000, axiosConfig = {}) {
    const axiosInstance = axios.create({
        baseURL: apiUri,
        timeout,
        ...axiosConfig
    });
    async function get(url, params) {
        return axiosInstance
            .get(url, { params })
            .then((res) => res.data)
            .catch(error => {
            console.log(error.response && error.response !== undefined
                ? JSON.stringify(error.response.data)
                : error);
            console.log(error.message ? error.message : `${url} error`);
            throw error;
        });
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
                    return get(`/api/spot/v3/instruments/${instrument_id}/trades`, params);
                },
                async getSpotCandles(instrument_id, params) {
                    return get(`/api/spot/v3/instruments/${instrument_id}/candles`, params);
                }
            };
        },
        futures() {
            return {
                async getInstruments() {
                    return get('/api/futures/v3/instruments');
                },
                async getBook(instrument_id, params) {
                    return get(`/api/futures/v3/instruments/${instrument_id}/book${params ? `?${querystring.stringify(params)}` : ''}`);
                },
                async getTicker(instrument_id) {
                    return get(`/api/futures/v3/instruments${instrument_id ? `/${instrument_id}` : ''}/ticker`);
                },
                async getTrades(instrument_id, params) {
                    return get(`/api/futures/v3/instruments/${instrument_id}/trades${params ? `?${querystring.stringify(params)}` : ''}`);
                },
                async getCandles(instrument_id, params) {
                    return get(`/api/futures/v3/instruments/${instrument_id}/candles${params ? `?${querystring.stringify(params)}` : ''}`);
                },
                async getIndex(instrument_id) {
                    return get(`/api/futures/v3/instruments/${instrument_id}/index`);
                },
                async getRate() {
                    return get('/api/futures/v3/rate');
                },
                async getEstimatedPrice(instrument_id) {
                    return get(`/api/futures/v3/instruments/${instrument_id}/estimated_price`);
                },
                async getOpenInterest(instrument_id) {
                    return get(`/api/futures/v3/instruments/${instrument_id}/open_interest`);
                },
                async getPriceLimit(instrument_id) {
                    return get(`/api/futures/v3/instruments/${instrument_id}/price_limit`);
                },
                async getLiquidation(instrument_id, params) {
                    return get(`/api/futures/v3/instruments/${instrument_id}/liquidation?${querystring.stringify(params)}`);
                },
                async getMarkPrice(instrument_id) {
                    return get(`/api/futures/v3/instruments/${instrument_id}/mark_price`);
                }
            };
        },
        swap() {
            return {
                async getInstruments() {
                    return get('/api/swap/v3/instruments');
                },
                async getDepth(instrument_id, size) {
                    return get(`/api/swap/v3/instruments/${instrument_id}/depth${size ? `?size=${size}` : ''}`);
                },
                async getTicker(instrument_id) {
                    return get(`/api/swap/v3/instruments${instrument_id ? `/${instrument_id}` : ''}/ticker`);
                },
                async getTrades(instrument_id, params) {
                    return get(`/api/swap/v3/instruments/${instrument_id}/trades${params ? `?${querystring.stringify(params)}` : ''}`);
                },
                async getCandles(instrument_id, params) {
                    return get(`/api/swap/v3/instruments/${instrument_id}/candles${params ? `?${querystring.stringify(params)}` : ''}`);
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
                    return get(`/api/swap/v3/instruments/${instrument_id}/liquidation`, params);
                },
                async getFundingTime(instrument_id) {
                    return get(`/api/swap/v3/instruments/${instrument_id}/funding_time`);
                },
                async getMarkPrice(instrument_id) {
                    return get(`/api/swap/v3/instruments/${instrument_id}/mark_price`);
                },
                async getHistoricalFudingRate(instrument_id, params) {
                    return get(`/api/swap/v3/instruments/${instrument_id}/historical_funding_rate`, params);
                }
            };
        },
        ett() {
            return {
                getConstituents(ett) {
                    return get(`/api/ett/v3/constituents${ett ? `/${ett}` : ''}`);
                },
                getDefinePrice(ett) {
                    return get(`/api/ett/v3/define-price/${ett}`);
                }
            };
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHVibGljQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9QdWJsaWNDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0JBQStCO0FBRS9CLE9BQU8sS0FBd0IsTUFBTSxPQUFPLENBQUM7QUFDN0MsT0FBTyxLQUFLLFdBQVcsTUFBTSxhQUFhLENBQUM7QUFFM0MsTUFBTSxVQUFVLFlBQVksQ0FDMUIsTUFBTSxHQUFHLHNCQUFzQixFQUMvQixPQUFPLEdBQUcsSUFBSSxFQUNkLFdBQVcsR0FBRyxFQUFFO0lBRWhCLE1BQU0sYUFBYSxHQUFrQixLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ2hELE9BQU8sRUFBRSxNQUFNO1FBQ2YsT0FBTztRQUNQLEdBQUcsV0FBVztLQUNmLENBQUMsQ0FBQztJQUVILEtBQUssVUFBVSxHQUFHLENBQUMsR0FBVyxFQUFFLE1BQWU7UUFDN0MsT0FBTyxhQUFhO2FBQ2pCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQzthQUNwQixJQUFJLENBQUMsQ0FBQyxHQUEyQixFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO2FBQy9DLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNiLE9BQU8sQ0FBQyxHQUFHLENBQ1QsS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxLQUFLLFNBQVM7Z0JBQzVDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUNyQyxDQUFDLENBQUMsS0FBSyxDQUNWLENBQUM7WUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUMsQ0FBQztZQUM1RCxNQUFNLEtBQUssQ0FBQztRQUNkLENBQUMsQ0FB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