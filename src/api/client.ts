const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

export function getToken(): string | null {
  return authToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    // Try to pull a human-readable message out of a JSON error body.
    // The backend returns { "error": "..." } for all handled exceptions.
    let message = `Request failed with status ${response.status}`;
    if (text) {
      try {
        const json = JSON.parse(text);
        message = json.error || json.message || text;
      } catch {
        message = text;
      }
    }
    throw new Error(message);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),
};
