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