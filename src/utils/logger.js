const { createLogger, format, transports} = require("winston");
const { combine, timestamp, json, errors } = format;
const uuid = require("uuid").v4();

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const errorFilter = format((info, opts) => {
  return info.level === "error" ? info : false;
});

const infoFilter = format((info, opts) => {
  return info.level === "info" ? info : false;
});

const warnFilter = format((info, opts) => {
  return info.level === "warn" ? info : false;
});

const fatalFilter = format((info, opts) => {
  return info.level === "fatal" ? info : false;
})

const logger = createLogger({
    levels: logLevels,
    level: "debug",
    format: combine(errors({ stack: true }), timestamp(), json()),
    transports: [
      new transports.Console(),
      new transports.File({
        filename: "./logs/combined.log",
      }),
      new transports.File({
        filename: "./logs/error.log",
        level: "error",
        format: combine(errorFilter(), timestamp(), json()),
      }),
      new transports.File({
        filename: "./logs/info.log",
        level: "info",
        format: combine(infoFilter(), timestamp(), json()),
      }),
      new transports.File({
        filename: "./logs/warn.log",
        level: "warn",
        format: combine(warnFilter(), timestamp(), json()),
      }),
      new transports.File({
        filename: "./logs/Fatal.log",
        level: "fatal",
        format: combine(fatalFilter(), timestamp(), json()),
      }),
    ],
});

const log = logger.child({
    id:uuid
})

module.exports = log;
