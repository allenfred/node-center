import { isEmpty } from 'lodash';
import { createLogger, format, transports } from 'winston';
const { combine, splat, timestamp, printf, colorize } = format;

// https://github.com/winstonjs/winston/issues/1134
// https://medium.com/@ThreePotatoteers/winston-3-customize-timestamp-format-f510ce03b33d

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `[${timestamp}] [${level}] ${message} `;

  if (metadata && !isEmpty(metadata)) {
    msg += JSON.stringify(metadata);
  }

  return msg;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    colorize(),
    myFormat,
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new transports.Console(),
    // new transports.File({ filename: 'error.log', level: 'error' }),
    // new transports.File({ filename: 'info.log', level: 'info' }),
    // new transports.File({ filename: 'combined.log' }),
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

export default logger;
