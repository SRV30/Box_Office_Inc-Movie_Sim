import axios from "axios";

import { store } from "../app/store";
import { logout, setCredentials } from "../features/auth/authSlice";

const resolveBaseURL = () => {
  const envUrl = import.meta.env.VITE_BACKEND_API_URL?.trim();
  if (envUrl) {
    const cleaned = envUrl.replace(/\/+$/, "");
    return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
  }
  return "/api";
};

const baseURL = resolveBaseURL();
const REFRESH_BUFFER_MS = 60 * 1000;
const MIN_REFRESH_DELAY_MS = 5 * 1000;
const REFRESH_RETRY_DELAY_MS = 30 * 1000;
const MAX_RETRIES = 2;
const RETRY_DELAY_BASE = 1000;

const cleanDuplicateApiPrefix = (config) => {
  if (config.url && config.baseURL?.endsWith("/api") && config.url.startsWith("/api/")) {
    config.url = config.url.replace(/^\/api\//, "/");
  }
  return config;
};

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

refreshClient.interceptors.request.use((config) => {
  cleanDuplicateApiPrefix(config);
  return config;
});

const api = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshRequest = null;
let refreshTimer = null;

const isAuthEndpoint = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/register") ||
  url.includes("/auth/refresh") ||
  url.includes("/auth/logout");

export const isRefreshSessionRejected = (error) => {
  const status = error.response?.status;
  return status === 401 || status === 403 || status === 404;
};

const decodeAccessTokenExpiresAt = (token) => {
  if (!token) return null;
  const [, payload] = token.split(".");
  if (!payload) return null;
  const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
  const paddedPayload = normalizedPayload.padEnd(
    normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
    "="
  );
  try {
    const decodedPayload = JSON.parse(window.atob(paddedPayload));
    return decodedPayload?.exp ? decodedPayload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const clearScheduledRefresh = () => {
  if (refreshTimer) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

const scheduleRefreshRetry = () => {
  clearScheduledRefresh();
  const token = localStorage.getItem("token");
  if (!token) return;

  refreshTimer = window.setTimeout(() => {
    refreshAuthSession().catch((error) => {
      if (isRefreshSessionRejected(error)) {
        clearScheduledRefresh();
        store.dispatch(logout());
        return;
      }
      console.error("Scheduled session refresh failed:", error);
      scheduleRefreshRetry();
    });
  }, REFRESH_RETRY_DELAY_MS);
};

export const scheduleTokenRefresh = (token, accessTokenExpiresAt) => {
  clearScheduledRefresh();
  const expiresAt = accessTokenExpiresAt || decodeAccessTokenExpiresAt(token);
  if (!expiresAt) return;
  const refreshDelay = Math.max(
    expiresAt - Date.now() - REFRESH_BUFFER_MS,
    MIN_REFRESH_DELAY_MS
  );
  refreshTimer = window.setTimeout(() => {
    refreshAuthSession().catch((error) => {
      if (isRefreshSessionRejected(error)) {
        clearScheduledRefresh();
        store.dispatch(logout());
        return;
      }
      console.error("Scheduled session refresh failed:", error);
      scheduleRefreshRetry();
    });
  }, refreshDelay);
};

export const persistAuthSession = ({ user, token, accessTokenExpiresAt }) => {
  const resolvedAccessTokenExpiresAt =
    accessTokenExpiresAt || decodeAccessTokenExpiresAt(token);
  store.dispatch(
    setCredentials({
      user,
      token,
      accessTokenExpiresAt: resolvedAccessTokenExpiresAt,
    })
  );
  scheduleTokenRefresh(token, resolvedAccessTokenExpiresAt);
};

export const refreshAuthSession = async () => {
  if (!refreshRequest) {
    refreshRequest = refreshClient
      .post("/auth/refresh")
      .then((res) => {
        persistAuthSession({
          user: res.data.user,
          token: res.data.token,
          accessTokenExpiresAt: res.data.accessTokenExpiresAt,
        });
        return res;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
};

function normalizeApiError(error) {
  if (error.response) {
    let message =
      error.response.data?.message || error.response.data?.error;
    if (!message) {
      if (
        error.response.status === 502 ||
        error.response.status === 503 ||
        error.response.status === 504
      ) {
        message =
          "Backend server is unreachable (502 Bad Gateway). Please ensure the backend server is running on port 5000.";
      } else {
        message = "Something went wrong.";
      }
    }
    return {
      message,
      code: error.response.data?.code || "API_ERROR",
      status: error.response.status,
      errors: error.response.data?.errors,
    };
  }
  if (error.code === "ECONNABORTED") {
    return {
      message: "Request timed out. Please check your connection and try again.",
      code: "TIMEOUT",
      status: 0,
    };
  }
  return {
    message: "Network error. The server may be unreachable.",
    code: "NETWORK",
    status: 0,
  };
}

function shouldRetry(status, url = "") {
  if (isAuthEndpoint(url)) return false;
  if (!status) return true;
  if (status >= 500) return true;
  if (status === 429) return true;
  return false;
}

api.interceptors.request.use((config) => {
  cleanDuplicateApiPrefix(config);
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(normalizeApiError(error));
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await refreshAuthSession();
        const token = refreshResponse.data.token;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (isRefreshSessionRejected(refreshError)) {
          clearScheduledRefresh();
          store.dispatch(logout());
        }
        return Promise.reject(normalizeApiError(refreshError));
      }
    }

    const retryCount = originalRequest._retryCount || 0;
    if (
      retryCount < MAX_RETRIES &&
      shouldRetry(error.response?.status, originalRequest.url)
    ) {
      originalRequest._retryCount = retryCount + 1;
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    return Promise.reject(normalizeApiError(error));
  }
);

const refreshIfSessionIsNearExpiry = () => {
  const token = localStorage.getItem("token");
  const expiresAt =
    Number(localStorage.getItem("accessTokenExpiresAt")) ||
    decodeAccessTokenExpiresAt(token);
  if (!token || !expiresAt) return;
  if (expiresAt - Date.now() <= REFRESH_BUFFER_MS) {
    refreshAuthSession().catch((error) => {
      if (isRefreshSessionRejected(error)) {
        clearScheduledRefresh();
        store.dispatch(logout());
      }
    });
  }
};

const storedToken = localStorage.getItem("token");
const storedAccessTokenExpiresAt = Number(
  localStorage.getItem("accessTokenExpiresAt")
);
if (storedToken) {
  scheduleTokenRefresh(storedToken, storedAccessTokenExpiresAt || null);
}

window.addEventListener("focus", refreshIfSessionIsNearExpiry);
window.addEventListener("online", refreshIfSessionIsNearExpiry);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshIfSessionIsNearExpiry();
  }
});

export { normalizeApiError };

export default api;
