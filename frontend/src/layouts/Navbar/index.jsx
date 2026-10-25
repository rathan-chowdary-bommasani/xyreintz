import styles from "./index.module.css";
import DateStepper from "../../components/Shared/DateStepper";
import GateControl from "../../components/Shared/GateControl";
import { navTabs } from "../../utils/enums";

// Brand, the two screens, and the shared "where are we in time" controls:
// the decision day ("today") and the buying deadline. Both screens show only
// what was known at that moment.
const Navbar = (props) => {
  const { view, onViewChange, context } = props;

  return (
    <header className={styles.header}>
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <div className="leading-tight">
            <p className="text-base font-bold">WindDesk</p>
            <p className="text-xs text-ink-2">
              GB day-ahead wind, January 2026
            </p>
          </div>
        </div>

        <nav aria-label="Views" className={styles.tabs}>
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={styles.tab}
              aria-current={view === tab.id ? "page" : undefined}
              onClick={() => onViewChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {context && (
        <div className={styles.context}>
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
            <DateStepper
              label="Today"
              noun="day"
              dates={context.dates}
              value={context.today}
              onChange={context.onTodayChange}
            />
            <GateControl
              value={context.gate}
              defaultValue={context.defaultGate}
              onChange={context.onGateChange}
            />
            <p className="text-sm text-ink-2 lg:ml-auto">
              Both screens show only what was known at this deadline.
            </p>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
