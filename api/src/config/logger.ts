import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, errors } = winston.format;

export const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp, level, message, stack }) =>
      `${timestamp} [${level}]: ${stack ?? message}`,
    ),
  ),
  transports: [
    // 터미널 출력
    new winston.transports.Console(),

    // 날짜별 파일 저장
    new DailyRotateFile({
      dirname: 'log',
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
  ],
});