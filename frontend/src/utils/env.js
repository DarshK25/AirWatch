const FALLBACK_API_BASE_URL = 'http://localhost:8000/api/v1';

const trimTrailingSlash = (value) => value?.replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const configuredUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return FALLBACK_API_BASE_URL;
    }

    return `${origin}/api/v1`;
  }

  return FALLBACK_API_BASE_URL;
};

