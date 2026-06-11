declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE_URL?: string;
    };
  }
}

const DEFAULT_API_BASE_URL = 'https://bingsphere-backend.onrender.com/api/';

function normalizeApiBaseUrl(value?: string | null) {
  const candidate = value?.trim() || DEFAULT_API_BASE_URL;
  return candidate.endsWith('/') ? candidate : `${candidate}/`;
}

export function getApiBaseUrl() {
  return normalizeApiBaseUrl(window.__APP_CONFIG__?.API_BASE_URL);
}

export function apiUrl(path = '') {
  const normalizedPath = path.replace(/^\/+/, '');
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export {};
