const redis = require('redis');

const client = redis.createClient({
  url: 'redis://:Uwy0Pf8mi@8.210.170.98:6371',
});

export default client;
