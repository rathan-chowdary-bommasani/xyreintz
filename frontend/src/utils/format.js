// All market times are shown in UK local time, whatever the viewer's timezone.
export const MARKET_TZ = "Europe/London";

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: MARKET_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dayTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: MARKET_TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

const marketDayFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: MARKET_TZ,
  day: "numeric",
  month: "short",
});

const intFmt = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const oneDpFmt = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});
const axisKFmt = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

const isMissing = (v) => v === null || v === undefined || Number.isNaN(v);

// Assembled from parts so output doesn't depend on the ICU version's punctuation.
const parts = (fmt, date) =>
  Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));

// "2026-01-15" (a calendar date, no timezone) -> Date at UTC noon, safe to format.
export const calendarDate = (isoDate) => new Date(`${isoDate}T12:00:00Z`);

export const formatTime = (iso) => (iso ? timeFmt.format(new Date(iso)) : "–");

export const formatDayTime = (iso) => {
  if (!iso) return "–";
  const p = parts(dayTimeFmt, new Date(iso));
  return `${p.weekday} ${p.day} ${p.month}, ${p.hour}:${p.minute}`;
};

export const formatDate = (isoDate) => {
  if (!isoDate) return "–";
  const p = parts(dateFmt, calendarDate(isoDate));
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
};

export const formatShortDate = (isoDate) =>
  isoDate ? shortDateFmt.format(calendarDate(isoDate)) : "–";

// Instant -> "15 Jan" in UK time (for time-axis ticks).
export const formatMarketDay = (ms) => marketDayFmt.format(new Date(ms));

export const formatMW = (v) => (isMissing(v) ? "–" : `${intFmt.format(v)} MW`);

export const formatSignedMW = (v) => {
  if (isMissing(v)) return "–";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${intFmt.format(Math.abs(v))} MW`;
};

export const formatGWh = (mwh) => {
  if (isMissing(mwh)) return "–";
  const gwh = mwh / 1000;
  return `${Math.abs(gwh) >= 1000 ? intFmt.format(gwh) : oneDpFmt.format(gwh)} GWh`;
};

export const formatPct = (v) => (isMissing(v) ? "–" : `${oneDpFmt.format(v)}%`);

export const formatHours = (h) => (isMissing(h) ? "–" : `${oneDpFmt.format(h)} h`);

export const formatInt = (v) => (isMissing(v) ? "–" : intFmt.format(v));

// 20 -> "20 minutes", 150 -> "2 h 30 min".
export const formatMinutes = (min) => {
  if (isMissing(min)) return "–";
  if (min < 60) return `${min} ${min === 1 ? "minute" : "minutes"}`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
};

// Compact axis ticks: 12000 -> "12k", 1500 -> "1.5k", -500 -> "−500".
export const formatAxisMW = (v) => {
  const sign = v < 0 ? "−" : "";
  const abs = Math.abs(v);
  return abs >= 1000
    ? `${sign}${axisKFmt.format(abs / 1000)}k`
    : `${sign}${intFmt.format(abs)}`;
};

// Shift an ISO calendar date by whole days.
export const addDays = (isoDate, days) => {
  const d = calendarDate(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
