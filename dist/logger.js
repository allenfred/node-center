"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const winston_1 = require("winston");
const { combine, splat, timestamp, printf, colorize } = winston_1.format;
// https://github.com/winstonjs/winston/issues/1134
// https://medium.com/@ThreePotatoteers/winston-3-customize-timestamp-format-f510ce03b33d
const myFormat = printf((_a) => {
    var { level, message, timestamp } = _a, metadata = __rest(_a, ["level", "message", "timestamp"]);
    let msg = `[${timestamp}] [${level}] ${message} `;
    if (metadata && !lodash_1.isEmpty(metadata)) {
        msg += JSON.stringify(metadata);
    }
    return msg;
});
const logger = winston_1.createLogger({
    level: 'info',
    format: combine(timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }), colorize(), myFormat),
    transports: [
        //
        // - Write to all logs with level `info` and below to `quick-start-combined.log`.
        // - Write all logs error (and below) to `quick-start-error.log`.
        //
        new winston_1.transports.Console(),
    ],
});
//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(
//     new transports.Console({
//       format: format.combine(format.colorize(), format.simple()),
//     }),
//   );
// }
// console.log = function () {
//   logger.info.apply(logger, arguments);
// };
// console.info = function () {
//   logger.info.apply(logger, arguments);
// };
// console.warn = function () {
//   logger.warn.apply(logger, arguments);
// };
// console.error = function () {
//   logger.error.apply(logger, arguments);
// };
// console.debug = function () {
//   logger.debug.apply(logger, arguments);
// };
exports.default = logger;
//# sourceMappingURL=logger.js.map