import { MARKET_TZ } from "./format";

const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: MARKET_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// Offset of the market timezone from UTC at a given instant, in ms.
export const tzOffsetMs = (utcMs) => {
  const p = Object.fromEntries(
    partsFmt.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value])
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - utcMs;
};

// UTC epoch ms of 00:00 UK local time on an ISO calendar date (chart axis bounds).
export const localMidnightMs = (isoDate) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  return utcMidnight - tzOffsetMs(utcMidnight);
};
