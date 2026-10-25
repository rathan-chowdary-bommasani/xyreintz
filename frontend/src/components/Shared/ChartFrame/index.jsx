import { useId, useState } from "react";
import styles from "./index.module.css";
import DataTable from "../DataTable";

// Shared chrome for every chart: title, one-line reading guide, legend, and a
// table view so no value is reachable only through a hover tooltip.
const ChartFrame = ({
  title,
  description,
  legend,
  table,
  height = 300,
  children,
  footer,
}) => {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  const toggleTable = () => setShowTable((prev) => !prev);

  return (
    <section className={styles.frame} aria-label={title}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="max-w-[62ch]">
          <h3 className="text-lg font-bold leading-snug">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-ink-2">{description}</p>
          )}
        </div>
        {table && (
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={showTable}
            aria-controls={tableId}
            onClick={toggleTable}
          >
            {showTable ? "Show chart" : "Show table"}
          </button>
        )}
      </div>

      {legend?.length > 0 && !showTable && (
        <ul className={styles.legend}>
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span
                className={styles.key}
                data-kind={item.kind ?? "line"}
                style={{ "--key": item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <div id={tableId}>
        {showTable && table ? (
          <DataTable {...table} />
        ) : (
          <div className={styles.plot} style={{ height }}>
            {children}
          </div>
        )}
      </div>
      {footer && <div className="mt-3 text-sm text-ink-2">{footer}</div>}
    </section>
  );
};

export default ChartFrame;
