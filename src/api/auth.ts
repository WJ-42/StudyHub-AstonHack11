import { api, setToken } from './client';

export interface AuthResponse {
  token: string;
  email: string;
  displayName: string;
}

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/register', {
    email,
    password,
    displayName,
  });
  setToken(response.token);
  return response;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/login', {
    email,
    password,
  });
  setToken(response.token);
  return response;
}

export function logout() {
  setToken(null);
}