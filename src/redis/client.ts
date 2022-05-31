// import Redis from 'ioredis';
const Redis = require('ioredis');

const redisClient = new Redis({
  host: '8.210.170.98',
  port: 6371,
  password: '%Uwy0Pf8m:i&',
});

export default redisClient;
