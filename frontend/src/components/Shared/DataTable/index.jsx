import styles from "./index.module.css";

// columns: [{ key, label, format?, align? }]
// rows: plain objects; rowKey: field used as React key
const DataTable = ({
  columns,
  rows,
  rowKey,
  caption,
  maxHeight = 360,
  onRowClick,
}) => {
  return (
    <div className={styles.wrap} style={{ maxHeight }}>
      <table className={styles.table}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" data-align={col.align ?? "right"}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              data-clickable={onRowClick ? "" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} data-align={col.align ?? "right"}>
                  {col.format ? col.format(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
