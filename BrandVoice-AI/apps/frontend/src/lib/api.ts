import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiResponse } from '@brandvoice/shared';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request interceptor – attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brandvoice-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor – normalize errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('brandvoice-token');
      const path = window.location.pathname;
      const isPublic = path === '/' || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/landing');
      if (!isPublic) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.error ?? error.message ?? 'Request failed';
    return Promise.reject(new Error(message));
  }
);

/** Type-safe GET */
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<ApiResponse<T>>(url, { params });
  return res.data.data as T;
}

/** Type-safe POST */
export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.post<ApiResponse<T>>(url, data);
  return res.data.data as T;
}

/** Type-safe PATCH */
export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.patch<ApiResponse<T>>(url, data);
  return res.data.data as T;
}

/** Type-safe PUT */
export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.put<ApiResponse<T>>(url, data);
  return res.data.data as T;
}

/** Type-safe DELETE */
export async function apiDelete<T>(url: string): Promise<T> {
  const res = await api.delete<ApiResponse<T>>(url);
  return res.data.data as T;
}
