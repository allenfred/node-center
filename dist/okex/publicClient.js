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
const axios = require('axios');
const querystring = require('querystring');
function PublicClient(apiUri = 'https://www.okex.me', timeout = 3000, axiosConfig = {}) {
    const axiosInstance = axios.default.create(Object.assign({ baseURL: apiUri, timeout }, axiosConfig));
    function get(url, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield axiosInstance.get(url, { params }).then(res => res.data);
            }
            catch (error) {
                return yield axiosInstance
                    .get(url, { params })
                    .then(res => res.data)
                    .catch(err => {
                    return axiosInstance.get(url, { params }).then(res => res.data);
                });
            }
        });
    }
    return {
        spot() {
            return {
                getSpotInstruments() {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get('/api/spot/v3/instruments');
                    });
                },
                getSpotBook(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/spot/v3/instruments/${instrument_id}/book`, params);
                    });
                },
                getSpotTicker(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return instrument_id
                            ? get(`/api/spot/v3/instruments/${instrument_id}/ticker`)
                            : get('/api/spot/v3/instruments/ticker');
                    });
                },
                getSpotTrade(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/spot/v3/instruments/${instrument_id}/trades`, params);
                    });
                },
                getSpotCandles(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/spot/v3/instruments/${instrument_id}/candles`, params);
                    });
                },
            };
        },
        futures() {
            return {
                getInstruments() {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get('/api/futures/v3/instruments');
                    });
                },
                getBook(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments/${instrument_id}/book${params ? `?${querystring.stringify(params)}` : ''}`);
                    });
                },
                getTicker(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments${instrument_id ? `/${instrument_id}` : ''}/ticker`);
                    });
                },
                getTrades(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments/${instrument_id}/trades${params ? `?${querystring.stringify(params)}` : ''}`);
                    });
                },
                getCandles(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments/${instrument_id}/candles${params ? `?${querystring.stringify(params)}` : ''}`);
                    });
                },
                getIndex(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments/${instrument_id}/index`);
                    });
                },
                getRate() {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get('/api/futures/v3/rate');
                    });
                },
                getEstimatedPrice(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments/${instrument_id}/estimated_price`);
                    });
                },
                getOpenInterest(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments/${instrument_id}/open_interest`);
                    });
                },
                getPriceLimit(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments/${instrument_id}/price_limit`);
                    });
                },
                getLiquidation(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments/${instrument_id}/liquidation?${querystring.stringify(params)}`);
                    });
                },
                getMarkPrice(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/futures/v3/instruments/${instrument_id}/mark_price`);
                    });
                },
            };
        },
        swap() {
            return {
                getInstruments() {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get('/api/swap/v3/instruments');
                    });
                },
                getDepth(instrument_id, size) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/depth${size ? `?size=${size}` : ''}`);
                    });
                },
                getTicker(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments${instrument_id ? `/${instrument_id}` : ''}/ticker`);
                    });
                },
                getTrades(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/trades${params ? `?${querystring.stringify(params)}` : ''}`);
                    });
                },
                getCandles(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/candles${params ? `?${querystring.stringify(params)}` : ''}`);
                    });
                },
                getIndex(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/index`);
                    });
                },
                getRate() {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get('/api/swap/v3/rate');
                    });
                },
                getOpenInterest(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/open_interest`);
                    });
                },
                getPriceLimit(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/price_limit`);
                    });
                },
                getLiquidation(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/liquidation`, params);
                    });
                },
                getFundingTime(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/funding_time`);
                    });
                },
                getMarkPrice(instrument_id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/mark_price`);
                    });
                },
                getHistoricalFudingRate(instrument_id, params) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return get(`/api/swap/v3/instruments/${instrument_id}/historical_funding_rate`, params);
                    });
                },
            };
        },
    };
}
exports.default = PublicClient;
//# sourceMappingURL=publicClient.js.map