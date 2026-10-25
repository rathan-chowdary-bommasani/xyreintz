import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import ChartFrame from "../Shared/ChartFrame";
import FigureStrip from "../Shared/FigureStrip";
import StatusMessage from "../Shared/StatusMessage";
import DayChart from "./DayChart";
import {
  formatDate,
  formatDayTime,
  formatGWh,
  formatMinutes,
  formatMW,
  formatTime,
} from "../../utils/format";

// Loaded delivery days by "date|gate". The data is historical, so a day never
// changes and is shown straight away when the user comes back to it.
const dayAheadCache = new Map();

const DayContent = (props) => {
  const { data, today, isFetching } = props;

  const usedRun = data.forecast_runs.at(-1);

  const figures = [
    {
      label: "Forecast used",
      value: usedRun ? `${formatTime(usedRun)} run` : "None",
      note: usedRun
        ? `Published ${formatMinutes(data.latest_run_age_min)} before the deadline`
        : null,
    },
    {
      label: "Forecast wind energy",
      value: formatGWh(data.summary.forecast_energy_mwh),
      note: "Total over the delivery day",
    },
  ];

  return (
    <div
      className={`space-y-6 transition-opacity ${
        isFetching ? "opacity-70" : ""
      }`}
    >
      <div className="max-w-[70ch]">
        <h2 className="text-2xl font-bold leading-tight">
          Wind forecast for tomorrow, {formatDate(data.delivery_date)}
        </h2>
        <p className="mt-2 text-ink-2">
          Today is {formatDate(today)}.{" "}
          {usedRun ? (
            <>
              The latest forecast available at the {formatTime(data.gate_time)} buying
              deadline was published at{" "}
              {formatTime(usedRun)}, {formatMinutes(data.latest_run_age_min)} before it.
            </>
          ) : (
            <>
              No forecast had been published before the buying deadline (
              {formatDayTime(data.gate_time)}).
            </>
          )}
        </p>
      </div>

      <FigureStrip caption="Forecast figures" items={figures} />

      <ChartFrame
        title="Forecast wind generation, hour by hour"
        description="MW, UK time. The latest forecast available at the buying deadline."
        height={340}
        table={{
          caption: "Hourly forecast",
          rowKey: "start_time",
          rows: data.points,
          columns: [
            {
              key: "start_time",
              label: "Hour (UK)",
              align: "left",
              format: formatTime,
            },
            { key: "forecast", label: "Forecast", format: formatMW },
          ],
        }}
      >
        <DayChart deliveryDate={data.delivery_date} points={data.points} />
      </ChartFrame>
    </div>
  );
};

// Requirement 1: the latest wind forecast available when the day-ahead buying
// decision is made. Shows only what the desk could know at the deadline.
const DayAheadContent = (props) => {
  const { today, deliveryDate, gate } = props;

  const cacheKey = `${deliveryDate}|${gate}`;
  const cached = dayAheadCache.get(cacheKey);
  const isEnabled = Boolean(deliveryDate && gate);

  // The last day shown stays on screen (dimmed) while the next one loads.
  const [shown, setShown] = useState(cached ?? null);
  const [error, setError] = useState(null);
  const [prevKey, setPrevKey] = useState(cacheKey);

  // Adjusted during render rather than in an effect, so it applies to this render.
  if (prevKey !== cacheKey) {
    setPrevKey(cacheKey);
    setError(null);
  }
  if (cached && shown !== cached) setShown(cached);

  const dayAhead = error ? null : shown;
  const isLoading = !dayAhead && !error;
  const isFetching = isEnabled && !cached && !error;

  useEffect(() => {
    const key = `${deliveryDate}|${gate}`;
    if (!deliveryDate || !gate || dayAheadCache.has(key)) return;

    const controller = new AbortController();
    const { signal } = controller;

    const getDayAhead = async () => {
      try {
        const data = await apiClient.get(
          `${apiClient.urls.winddesk.DAY_AHEAD_API}/${deliveryDate}`,
          { params: { gate }, signal, retry: 1 }
        );
        dayAheadCache.set(key, data);
        if (!signal.aborted) setShown(data);
      } catch (err) {
        if (!signal.aborted) setError(err);
      }
    };

    getDayAhead();
    return () => controller.abort();
  }, [deliveryDate, gate]);

  return (
    <div className="space-y-6">
      {isLoading && <StatusMessage title="Loading delivery day" />}
      {error && (
        <StatusMessage
          tone="error"
          title="This delivery day could not be loaded"
        >
          {error.message}
        </StatusMessage>
      )}
      {dayAhead && !error && (
        <DayContent data={dayAhead} today={today} isFetching={isFetching} />
      )}
    </div>
  );
};

export default DayAheadContent;
