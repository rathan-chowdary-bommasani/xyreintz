import { useEffect, useState } from "react";
import "./App.css";
import apiClient from "./utils/apiClient";
import { parseUrlState, updateUrlState } from "./utils/urlState";
import Navbar from "./layouts/Navbar";
import Footer from "./layouts/Footer";
import StatusMessage from "./components/Shared/StatusMessage";
import DayAhead from "./pages/DayAhead";
import Accuracy from "./pages/Accuracy";
import { addDays } from "./utils/format";

const GATE_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const App = () => {
  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState(null);
  const [metaAttempt, setMetaAttempt] = useState(0);
  const [search, setSearch] = useState(window.location.search);

  const urlState = parseUrlState(search);
  const isMetaLoading = !meta && !metaError;

  const view = urlState.view === "accuracy" ? "accuracy" : "day";
  const defaultGate = meta?.default_gate ?? "09:50";
  const gate = GATE_REGEX.test(urlState.gate ?? "")
    ? urlState.gate
    : defaultGate;

  // "Today" is the decision day; the desk buys for tomorrow.
  const decisionDates = meta?.decision_dates ?? [];
  const today = decisionDates.includes(urlState.today)
    ? urlState.today
    : decisionDates.at(-1);
  const deliveryDate = today ? addDays(today, 1) : null;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const getMeta = async () => {
      try {
        const data = await apiClient.get(apiClient.urls.winddesk.META_API, {
          signal,
          // First load may wait on the backend fetching from Elexon; retry 503s patiently.
          retry: (count, error) => error?.status === 503 && count < 5,
          retryDelay: 3000,
        });
        if (!signal.aborted) setMeta(data);
      } catch (err) {
        if (!signal.aborted) setMetaError(err);
      }
    };

    getMeta();
    return () => controller.abort();
  }, [metaAttempt]);

  // Back/forward buttons change the query string without going through us.
  useEffect(() => {
    const handlePopState = () => setSearch(window.location.search);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setUrlState = (changes, options) =>
    setSearch(updateUrlState(changes, options));

  const handleViewChange = (next) =>
    setUrlState({ view: next === "day" ? null : next });

  const handleTodayChange = (date) => setUrlState({ today: date });

  const handleGateChange = (value) =>
    setUrlState(
      { gate: value === defaultGate ? null : value },
      { replace: true }
    );

  const handleRetry = () => {
    setMetaError(null);
    setMetaAttempt((attempt) => attempt + 1);
  };

  return (
    <>
      <Navbar
        view={view}
        onViewChange={handleViewChange}
        context={
          meta && {
            dates: decisionDates,
            today,
            onTodayChange: handleTodayChange,
            gate,
            defaultGate,
            onGateChange: handleGateChange,
          }
        }
      />
      <main className="mx-auto max-w-[1180px] px-4 pt-6 pb-16 sm:px-6">
        {isMetaLoading && (
          <StatusMessage title="Loading January 2026 wind data from Elexon">
            The first load fetches every forecast and half-hourly outturn for
            the month. It takes a few seconds and is cached afterwards.
          </StatusMessage>
        )}
        {metaError && (
          <StatusMessage
            tone="error"
            title="Wind data is not available"
            action={
              <button
                type="button"
                className="font-semibold underline"
                onClick={handleRetry}
              >
                Try again
              </button>
            }
          >
            {metaError.message}
          </StatusMessage>
        )}
        {meta && view === "day" && (
          <DayAhead today={today} deliveryDate={deliveryDate} gate={gate} />
        )}
        {meta && view === "accuracy" && (
          <Accuracy meta={meta} today={today} gate={gate} />
        )}
      </main>
      {meta && <Footer data={meta.data} />}
    </>
  );
};

export default App;
