const FALLBACK_API_BASE_URL = 'https://airwatch-p0bo.onrender.com/api/v1';

const trimTrailingSlash = (value) => value?.replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const envUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);

  if (envUrl) {
    return envUrl;
  }

  // In dev (localhost), allow override via .env or fallback to Render backend
  return FALLBACK_API_BASE_URL;
};

