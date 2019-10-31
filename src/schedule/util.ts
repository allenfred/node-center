import { getCandlesWithLimitedSpeed } from '../okex/common';
import { getInstrumentAlias, getISOString } from '../util';

//设置系统限速规则: (okex官方API 限速规则：20次/2s)
async function execJob(futures, swaps, granularity) {
  const futureOptions = futures.map(i => {
    return Object.assign({}, i, {
      start: getISOString((-200 * granularity) / 60, 'm'),
      end: new Date().toISOString(),
      granularity,
      alias: getInstrumentAlias(i.instrument_id),
    });
  });

  const swapOptions = swaps.map(i => {
    return Object.assign({}, i, {
      start: getISOString((-200 * granularity) / 60, 'm'),
      end: new Date().toISOString(),
      granularity,
      alias: getInstrumentAlias(i.instrument_id),
    });
  });
  return await getCandlesWithLimitedSpeed(futureOptions.concat(swapOptions));
}

function isDailyScheduleTime(date: Date) {
  return +date.getHours() % 24 && +date.getMinutes() === 0 ? true : false;
}

function isTwelveHoursScheduleTime(date: Date) {
  return +date.getHours() % 12 && +date.getMinutes() === 0 ? true : false;
}

function isSixHoursScheduleTime(date: Date) {
  return +date.getHours() % 6 && +date.getMinutes() === 0 ? true : false;
}

function isFourHoursScheduleTime(date: Date) {
  return +date.getHours() % 4 && +date.getMinutes() === 0 ? true : false;
}

function isTwoHoursScheduleTime(date: Date) {
  return +date.getHours() % 2 && +date.getMinutes() === 0 ? true : false;
}

function isHourlyScheduleTime(date: Date) {
  return +date.getMinutes() === 0 ? true : false;
}

function isThirtyMinutesScheduleTime(date: Date) {
  return +date.getMinutes() % 30 === 0 ? true : false;
}

function isFifteenMinutesScheduleTime(date: Date) {
  return +date.getMinutes() % 15 === 0 ? true : false;
}

function isFiveMinutesScheduleTime(date: Date) {
  return +date.getMinutes() % 5 === 0 ? true : false;
}

function isThreeMinutesScheduleTime(date: Date) {
  return +date.getMinutes() % 3 === 0 ? true : false;
}

export {
  isDailyScheduleTime,
  isTwelveHoursScheduleTime,
  isSixHoursScheduleTime,
  isFourHoursScheduleTime,
  isTwoHoursScheduleTime,
  isHourlyScheduleTime,
  isThirtyMinutesScheduleTime,
  isFifteenMinutesScheduleTime,
  isFiveMinutesScheduleTime,
  isThreeMinutesScheduleTime,
  execJob,
};
