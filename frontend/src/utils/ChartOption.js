// Shared Recharts styling so every chart reads as one system.
export const AXIS_TICK = { fill: "var(--muted)", fontSize: 12 };

export const xAxisProps = {
  tick: AXIS_TICK,
  tickLine: false,
  axisLine: { stroke: "var(--baseline)" },
};

export const yAxisProps = {
  tick: AXIS_TICK,
  tickLine: false,
  axisLine: false,
  width: 44,
};

export const gridProps = { vertical: false, stroke: "var(--hairline)" };

// Rounded data end, square at the baseline; thin bars with air between them.
export const barProps = {
  radius: [4, 4, 0, 0],
  maxBarSize: 24,
  isAnimationActive: false,
};
