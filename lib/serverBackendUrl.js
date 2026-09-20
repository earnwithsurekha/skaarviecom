export const buildBackendApiUrl = (...pathSegments) => {
  const backendUrl = new URL(
    process.env.BACKEND_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || process.env.NEXT_PUBLIC_API_URL
    || 'http://localhost:5000'
  );
  const basePathSegments = backendUrl.pathname.split('/').filter(Boolean);

  if (basePathSegments.at(-1) !== 'api') {
    basePathSegments.push('api');
  }

  backendUrl.pathname = [...basePathSegments, ...pathSegments].join('/');
  backendUrl.search = '';
  backendUrl.hash = '';

  return backendUrl.toString();
};

export const buildBackendRequestUrl = (apiPath) => {
  const requestUrl = new URL(String(apiPath), 'https://internal.invalid');
  const apiPathIndex = requestUrl.pathname.lastIndexOf('/api/');
  const normalizedPath = apiPathIndex >= 0
    ? requestUrl.pathname.slice(apiPathIndex + 5)
    : requestUrl.pathname.replace(/^\/api(?:\/|$)/, '');
  const pathSegments = normalizedPath
    .split('/')
    .filter(Boolean);
  const backendUrl = new URL(buildBackendApiUrl(...pathSegments));

  backendUrl.search = requestUrl.search;
  return backendUrl.toString();
};

export const fetchBackend = (apiPath, options) => (
  fetch(buildBackendRequestUrl(apiPath), options)
);