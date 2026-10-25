import { useId } from "react";
import styles from "./index.module.css";
import { formatDate } from "../../../utils/format";

// Pick a day from a fixed list, with previous/next buttons.
const DateStepper = ({ label, noun, dates, value, onChange }) => {
  const id = useId();
  const index = dates.indexOf(value);
  const prev = dates[index - 1];
  const next = dates[index + 1];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-ink-2">
        {label}
      </label>
      <div className={styles.group}>
        <button
          type="button"
          className={styles.step}
          onClick={() => onChange(prev)}
          disabled={!prev}
          aria-label={`Previous ${noun}`}
        >
          ‹
        </button>
        <select
          id={id}
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {dates.map((date) => (
            <option key={date} value={date}>
              {formatDate(date)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.step}
          onClick={() => onChange(next)}
          disabled={!next}
          aria-label={`Next ${noun}`}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default DateStepper;
