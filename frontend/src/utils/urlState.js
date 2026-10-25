// View state (tab, delivery date, gate) lives in the query string so any view
// can be bookmarked or pasted into a chat with the desk.

export const parseUrlState = (search) =>
  Object.fromEntries(new URLSearchParams(search));

// Applies changes to the query string (null, undefined or "" removes a key)
// and returns the new search string.
export const updateUrlState = (changes, { replace = false } = {}) => {
  const next = new URLSearchParams(window.location.search);

  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }

  const url = `${window.location.pathname}${next.size ? `?${next}` : ""}`;
  window.history[replace ? "replaceState" : "pushState"](null, "", url);

  return window.location.search;
};
