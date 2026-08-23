import { API_BASE_URL, DEFAULT_DEV_API_URL } from '../../config/env';
import { tokenStorage } from '../../lib/auth/tokenStorage';

interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly title?: string;
  public readonly detail?: string;
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(status: number, problem?: ProblemDetails) {
    super(problem?.detail ?? problem?.title ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.title = problem?.title;
    this.detail = problem?.detail;
    this.fieldErrors = problem?.errors;
  }

  get validationMessages(): string[] {
    return Object.values(this.fieldErrors ?? {}).flat();
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json', // по дефолту
    ...(options.headers as Record<string, string>), // добавляется к дефолтным, может переопределить их
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers }); // headers добавляются или перезаписывают то, что было в options
  } catch (error) {
    if (error instanceof TypeError && import.meta.env.DEV) {
      throw new Error(
        `Не удалось подключиться к API по адресу ${API_BASE_URL}. Запустите backend на ${DEFAULT_DEV_API_URL}.`,
      );
    }

    throw error;
  }

  if (!response.ok) {
    let problem: ProblemDetails | undefined;

    try {
      problem = (await response.json()) as ProblemDetails;
    } catch {
      problem = undefined;
    }

    throw new ApiError(response.status, problem);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => // body не обязателен
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
