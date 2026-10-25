import { useId } from "react";
import styles from "./index.module.css";

// Buying deadline (UK local time) on the decision day. Both screens follow it.
const GateControl = ({ value, defaultValue, onChange }) => {
  const id = useId();

  const handleChange = (e) => {
    if (e.target.value) onChange(e.target.value);
  };

  const handleReset = () => onChange(defaultValue);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-ink-2">
        Buying deadline
      </label>
      <input
        id={id}
        type="time"
        step={60}
        className={`${styles.input} tabular`}
        value={value}
        onChange={handleChange}
      />
      {value !== defaultValue && (
        <button type="button" className={styles.reset} onClick={handleReset}>
          Reset to {defaultValue}
        </button>
      )}
    </div>
  );
};

export default GateControl;
