import { config } from 'dotenv';
import { resolve } from 'path';
import * as _ from 'lodash';

if (process.env.ENV !== 'local') {
  config({
    path: resolve(__dirname, `../../.env`),
  });
}

export default {
  DEBUG: process.env.DEBUG === 'true',
  HOST: process.env.HOST || '',
  PORT: process.env.PORT,
  SOCKET_CORS_ORIGIN: process.env.SOCKET_CORS_ORIGIN.split(','),
  MYSQL_DATABASE: process.env.MYSQL_DATABASE,
  MYSQL_USER: process.env.MYSQL_USER,
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_PORT: process.env.MYSQL_PORT,
  MONGO_DATABASE: process.env.MONGO_DATABASE,
  MONGO_USER: process.env.MONGO_USER,
  MONGO_PASSWORD: process.env.MONGO_PASSWORD,
  MONGO_HOST: process.env.MONGO_HOST,
  MONGO_PORT: process.env.MONGO_PORT,
};
