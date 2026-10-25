import styles from "./index.module.css";

// Presentational tooltip body. Charts pass already-formatted rows so the
// tooltip never needs to know about the data shape.
// rows: [{ label, value, color? }]
const ChartTooltip = ({ title, rows }) => {
  return (
    <div className={styles.tip}>
      <p className={styles.title}>{title}</p>
      <dl className={styles.rows}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <dt className="flex items-center gap-2">
              {row.color && (
                <span
                  className={styles.swatch}
                  style={{ background: row.color }}
                />
              )}
              {row.label}
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default ChartTooltip;
