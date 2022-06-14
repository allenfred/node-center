"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require('redis');
const client = redis.createClient({
    url: 'redis://:Uwy0Pf8mi@8.210.170.98:6371',
});
exports.default = client;
//# sourceMappingURL=client.js.map