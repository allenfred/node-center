"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
if (process.env.ENV !== 'local') {
    dotenv_1.config({
        path: path_1.resolve(__dirname, `../../.env`),
    });
}
exports.default = {
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
//# sourceMappingURL=envVars.js.map