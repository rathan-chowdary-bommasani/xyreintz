// apiClient.js
import * as apiUrls from "../utils";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const buildUrl = (url, params) => {
  const query = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, value]) => value != null)
  );
  return `${url}${query.size ? `?${query}` : ""}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiRequest = async (
  url,
  { method = "GET", params, signal } = {}
) => {
  const response = await fetch(buildUrl(url, params), {
    method,
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const data = await response.json();
      detail =
        typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail);
    } catch {
      // non-JSON error body
    }
    throw new ApiError(detail, response.status);
  }

  return response.json();
};

// retry: how many times to try again, or (failureCount, error) => boolean.
// Aborted requests are never retried.
const withRetry = async (request, { retry = 0, retryDelay = 1000, signal } = {}) => {
  for (let failureCount = 0; ; failureCount++) {
    try {
      return await request();
    } catch (err) {
      const shouldRetry =
        typeof retry === "function"
          ? retry(failureCount, err)
          : failureCount < retry;

      if (signal?.aborted || !shouldRetry) throw err;

      await sleep(retryDelay);
    }
  }
};

const apiClient = {
  get: (url, opts = {}) =>
    withRetry(() => apiRequest(url, { ...opts, method: "GET" }), opts),
  urls: { winddesk: apiUrls },
};

export default apiClient;
