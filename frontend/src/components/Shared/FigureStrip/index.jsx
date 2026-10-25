import styles from "./index.module.css";

// A row of headline figures separated by hairlines rather than boxed cards.
// items: [{ label, value, note? }]
const FigureStrip = ({ items, caption }) => {
  return (
    <section aria-label={caption} className={styles.strip}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <p className="text-sm text-ink-2">{item.label}</p>
          <p className={styles.value}>{item.value}</p>
          {item.note && <p className="text-xs text-muted">{item.note}</p>}
        </div>
      ))}
    </section>
  );
};

export default FigureStrip;
