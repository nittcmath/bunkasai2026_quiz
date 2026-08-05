export const API_BASE = '/api/gas';

type ApiFetchOptions = RequestInit & {
  query?: Record<string, string | number | boolean | null | undefined>;
};

const isRemoteGasBase = /^https?:\/\//i.test(API_BASE);

function readCookie(name: string) {
  if (typeof document === 'undefined') {
    return '';
  }
  const prefix = `${name}=`;
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length) ?? '';
}

function buildUrl(endpoint: string, query?: ApiFetchOptions['query']) {
  if (isRemoteGasBase) {
    const url = new URL(API_BASE);
    const remoteEndpoint = endpoint.startsWith('admin/') ? endpoint.slice('admin/'.length) : endpoint;
    url.searchParams.set('endpoint', remoteEndpoint);
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      url.searchParams.set(key, String(value));
    });
    return url.toString();
  }

  const basePath = endpoint.startsWith('admin/') ? '/api/admin' : API_BASE;
  const route = endpoint.startsWith('admin/') ? endpoint.slice('admin/'.length) : endpoint;
  const url = new URL(`${basePath}/${route}`, 'http://localhost');
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    url.searchParams.set(key, String(value));
  });
  const relativeUrl = `${url.pathname}${url.search}`;

  if (typeof window !== 'undefined') {
    return relativeUrl;
  }

  return new URL(relativeUrl, process.env.NEXT_PUBLIC_SITE_URL).toString();
}

function normalizeBody(endpoint: string, init?: ApiFetchOptions) {
  if (!isRemoteGasBase || (init?.method ?? 'GET').toUpperCase() === 'GET') {
    return init?.body;
  }

  const remoteEndpoint = endpoint.startsWith('admin/') ? endpoint.slice('admin/'.length) : endpoint;

  const body = init?.body;
  if (body == null) {
    return JSON.stringify({ endpoint: remoteEndpoint });
  }

  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return JSON.stringify({ endpoint: remoteEndpoint, ...parsed });
      }
    } catch {
      return body;
    }
  }

  return body;
}

export async function apiFetch<T>(endpoint: string, init?: ApiFetchOptions): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const csrfToken = method === 'GET' ? '' : readCookie('csrfToken');
  const response = await fetch(buildUrl(endpoint, init?.query), {
    ...init,
    method,
    body: normalizeBody(endpoint, init),
    headers: {
       Accept: 'application/json',
       'Content-Type': 'application/json',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const text = await response.text();

console.log('URL:', response.url);
console.log('STATUS:', response.status);
console.log('BODY:', text.slice(0, 500));

const payload = JSON.parse(text);
  if (!response.ok) {
    console.log(response)
    throw new Error(`Request failed: ${response.status}`);
  }
  if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
}
