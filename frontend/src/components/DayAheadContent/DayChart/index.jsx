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
  formatMW,
  formatTime,
} from "../../../utils/format";
import { localMidnightMs } from "../../../utils/time";

const THREE_HOURS = 3 * 3_600_000;

const DayTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <ChartTooltip
      title={`${formatTime(point.start_time)} UK`}
      rows={[
        {
          label: "Forecast",
          value: formatMW(point.forecast),
          color: "var(--series-forecast)",
        },
      ]}
    />
  );
};

// The decision-time forecast for one delivery day.
const DayChart = (props) => {
  const { deliveryDate, points } = props;

  const start = localMidnightMs(deliveryDate);
  const end = localMidnightMs(addDays(deliveryDate, 1));
  const domain = [start, end];

  const ticks = [];
  for (let t = start; t <= end; t += THREE_HOURS) ticks.push(t);

  const data = points.map((p) => ({ ...p, t: Date.parse(p.start_time) }));

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
          tickFormatter={(t) => formatTime(new Date(t).toISOString())}
          {...xAxisProps}
        />
        <YAxis
          {...yAxisProps}
          tickFormatter={formatAxisMW}
          domain={[0, "auto"]}
        />
        <Tooltip
          content={<DayTooltip />}
          cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
          isAnimationActive={false}
        />
        <Line
          dataKey="forecast"
          stroke="var(--series-forecast)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DayChart;
