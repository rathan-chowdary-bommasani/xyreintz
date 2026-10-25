const BASE_API_URL = import.meta.env.VITE_API_BASE ?? "";

// Window, decision and delivery dates, default deadline, data provenance

export const META_API = BASE_API_URL + "/api/meta";

// Screen 1: hourly forecast at the deadline (append /{delivery_date})

export const DAY_AHEAD_API = BASE_API_URL + "/api/day-ahead";

// Screen 2: forecast vs actual, scored through the day before as_of

export const ACCURACY_API = BASE_API_URL + "/api/accuracy";
