import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import ChartFrame from "../Shared/ChartFrame";
import FigureStrip from "../Shared/FigureStrip";
import StatusMessage from "../Shared/StatusMessage";
import MonthChart from "./MonthChart";
import {
  addDays,
  formatDate,
  formatDayTime,
  formatMW,
  formatPct,
} from "../../utils/format";

// Loaded reports by "gate|today". The data is historical, so a report never
// changes and is shown straight away when the user comes back to it.
const accuracyCache = new Map();

// Requirement 2: how accurate the forecast available at the buying deadline
// has been, scored only over delivery days that had finished by today's deadline.
const AccuracyContent = (props) => {
  const { meta, today, gate } = props;

  const cacheKey = `${gate}|${today}`;
  const cached = accuracyCache.get(cacheKey);
  const isEnabled = Boolean(gate && today);

  // The last report shown stays on screen (dimmed) while the next one loads.
  const [shown, setShown] = useState(cached ?? null);
  const [error, setError] = useState(null);
  const [prevKey, setPrevKey] = useState(cacheKey);

  // Adjusted during render rather than in an effect, so it applies to this render.
  if (prevKey !== cacheKey) {
    setPrevKey(cacheKey);
    setError(null);
  }
  if (cached && shown !== cached) setShown(cached);

  const report = error ? null : shown;
  const isFetching = isEnabled && !cached && !error;

  useEffect(() => {
    const key = `${gate}|${today}`;
    if (!gate || !today || accuracyCache.has(key)) return;

    const controller = new AbortController();
    const { signal } = controller;

    const getReport = async () => {
      try {
        const data = await apiClient.get(apiClient.urls.winddesk.ACCURACY_API, {
          params: { gate, as_of: today },
          signal,
          retry: 1,
        });
        accuracyCache.set(key, data);
        if (!signal.aborted) setShown(data);
      } catch (err) {
        if (!signal.aborted) setError(err);
      }
    };

    getReport();
    return () => controller.abort();
  }, [gate, today]);

  if (!report && !error) return <StatusMessage title="Scoring the forecast" />;

  if (error) {
    return (
      <StatusMessage
        tone="error"
        title="The accuracy report could not be loaded"
      >
        {error.message}
      </StatusMessage>
    );
  }

  const { summary, series, deadline } = report;
  const { stats } = summary;

  if (summary.days === 0) {
    const firstDelivery = meta.delivery_dates[0];

    return (
      <StatusMessage title="No delivery day has finished yet">
        At {formatDayTime(deadline)}, the first delivery day ({formatDate(firstDelivery)}) has not finished yet,
        so there is nothing to score. Accuracy builds up from {formatDate(addDays(firstDelivery, 1))}; move today
        forward to see it.
      </StatusMessage>
    );
  }

  return (
    <div
      className={`space-y-6 transition-opacity ${
        isFetching ? "opacity-70" : ""
      }`}
    >
      <div className="max-w-[70ch]">
        <h2 className="text-2xl font-bold leading-tight">
          How accurate has the forecast been, up to today?
        </h2>
        <p className="mt-2 text-ink-2">
          Across the {summary.days} delivery {summary.days === 1 ? "day" : "days"} completed by{" "}
          {formatDayTime(deadline)} ({formatDate(summary.first_day)} to {formatDate(summary.last_day)}), the
          forecast available at the {report.gate} deadline the day before was off by {formatMW(stats.mae)} in a
          typical hour.
        </p>
      </div>

      <FigureStrip
        caption="Accuracy"
        items={[
          {
            label: "Typical error",
            value: formatMW(stats.mae),
            note: `Average miss per hour, ${formatPct(stats.nmae_pct)} of average wind output`,
          },
        ]}
      />

      <ChartFrame
        title="Forecast vs actual, every hour"
        description="MW. The forecast available at each day's deadline, against what wind actually produced. The gap between the lines is the error."
        legend={[
          {
            label: "Forecast at the deadline",
            color: "var(--series-forecast)",
          },
          { label: "Actual generation", color: "var(--series-actual)" },
        ]}
        height={340}
        table={{
          caption: "Hourly forecast and actual",
          rowKey: "start_time",
          rows: series,
          columns: [
            {
              key: "start_time",
              label: "Hour (UK)",
              align: "left",
              format: formatDayTime,
            },
            { key: "forecast", label: "Forecast", format: formatMW },
            { key: "actual", label: "Actual", format: formatMW },
            {
              key: "diff",
              label: "Difference",
              format: (_, p) => formatMW(Math.abs(p.forecast - p.actual)),
            },
          ],
        }}
      >
        <MonthChart series={series} />
      </ChartFrame>
    </div>
  );
};

export default AccuracyContent;
