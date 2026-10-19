/**
 * Thin fetch wrapper for the Lizy Main-Backend.
 *
 * The backend serves three modules from one server, each with its own
 * Sanctum token table, so every call names the module whose token it sends:
 *   oms          /api/...          (orders, leads, tasks, ...)
 *   partnership  /api/v1/...       (partner portal / partnership admin)
 *   universal    /api/admin/...    (website content admin)
 */
export type Module = 'oms' | 'partnership' | 'universal';

type Query = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type Config = {
  baseUrl: string;
  tokens: Partial<Record<Module, string>>;
  onUnauthorized?: (module: Module) => void;
};

let config: Config = { baseUrl: '', tokens: {} };

export function configureApi(next: Partial<Config>) {
  config = { ...config, ...next };
}

export function getBaseUrl() {
  return config.baseUrl;
}

export function hasModule(module: Module) {
  return !!config.tokens[module];
}

/** "192.168.1.5:8000/" -> "http://192.168.1.5:8000"; drops a trailing "/api". */
export function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  return url.replace(/\/api$/i, '');
}

function queryString(query?: Query): string {
  if (!query) {
    return '';
  }
  const parts: string[] = [];
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(v => parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(v))}`));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  });
  return parts.length ? `?${parts.join('&')}` : '';
}

type Options = { method?: string; body?: unknown; query?: Query; timeoutMs?: number };

export async function request<T = any>(module: Module | null, path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, query, timeoutMs = 30000 } = options;
  if (!config.baseUrl) {
    throw new ApiError(0, 'No server address is set.');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = module ? config.tokens[module] : undefined;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/api${path}${queryString(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e: any) {
    const timedOut = e?.name === 'AbortError';
    throw new ApiError(
      0,
      timedOut
        ? 'The server took too long to answer. Please try again.'
        : `Cannot reach the server at ${config.baseUrl}. Check the address and your connection.`,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && module && token) {
      config.onUnauthorized?.(module);
    }
    const errors = data && typeof data === 'object' ? data.errors : undefined;
    const firstError = errors ? (Object.values(errors)[0] as string[] | undefined)?.[0] : undefined;
    let message = (data && typeof data === 'object' && data.message) || firstError || `Request failed (${response.status}).`;
    if (response.status === 403 && !data?.message) {
      message = 'You do not have permission to do this.';
    }
    if (response.status >= 500 && !data?.message) {
      message = 'The server had a problem. Please try again later.';
    }
    // Laravel's generic 422 message is less useful than the first field error.
    if (response.status === 422 && firstError) {
      message = firstError;
    }
    throw new ApiError(response.status, message, errors);
  }

  return data as T;
}

export const api = {
  get: <T = any>(module: Module | null, path: string, query?: Query) => request<T>(module, path, { query }),
  post: <T = any>(module: Module | null, path: string, body?: unknown) => request<T>(module, path, { method: 'POST', body: body ?? {} }),
  put: <T = any>(module: Module | null, path: string, body?: unknown) => request<T>(module, path, { method: 'PUT', body: body ?? {} }),
  patch: <T = any>(module: Module | null, path: string, body?: unknown) => request<T>(module, path, { method: 'PATCH', body: body ?? {} }),
  delete: <T = any>(module: Module | null, path: string) => request<T>(module, path, { method: 'DELETE' }),
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    return e.message;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return 'Something went wrong.';
}
