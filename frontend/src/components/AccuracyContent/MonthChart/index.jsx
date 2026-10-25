import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "../../Shared/ChartTooltip";
import { gridProps, xAxisProps, yAxisProps } from "../../../utils/ChartOption";
import {
  addDays,
  formatAxisMW,
  formatDayTime,
  formatMarketDay,
  formatMW,
} from "../../../utils/format";
import { localMidnightMs } from "../../../utils/time";

const SeriesTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <ChartTooltip
      title={`${formatDayTime(point.start_time)} UK`}
      rows={[
        {
          label: "Forecast at deadline",
          value: formatMW(point.forecast),
          color: "var(--series-forecast)",
        },
        {
          label: "Actual",
          value: formatMW(point.actual),
          color: "var(--series-actual)",
        },
        {
          label: "Difference",
          value: formatMW(Math.abs(point.forecast - point.actual)),
        },
      ]}
    />
  );
};

// Hourly forecast available at each day's deadline, against the actual.
const MonthChart = (props) => {
  const { series } = props;

  const data = series.map((p) => ({ ...p, t: Date.parse(p.start_time) }));
  const dates = [...new Set(series.map((p) => p.delivery_date))];
  const every = Math.max(1, Math.ceil(dates.length / 8)); // about 8 date labels
  const ticks = dates.filter((_, i) => i % every === 0).map(localMidnightMs);
  const domain = [
    localMidnightMs(dates[0]),
    localMidnightMs(addDays(dates.at(-1), 1)),
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={domain}
          ticks={ticks}
          tickFormatter={formatMarketDay}
          {...xAxisProps}
        />
        <YAxis
          {...yAxisProps}
          tickFormatter={formatAxisMW}
          domain={[0, "auto"]}
        />
        <Tooltip
          content={<SeriesTooltip />}
          cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
          isAnimationActive={false}
        />
        <Line
          dataKey="forecast"
          stroke="var(--series-forecast)"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
          isAnimationActive={false}
        />
        <Line
          dataKey="actual"
          stroke="var(--series-actual)"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MonthChart;
