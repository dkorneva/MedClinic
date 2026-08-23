import { apiClient } from '../../../shared/api/http/client';
import type { MeResponse, TokenResponse } from '../model/types';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
  role: string;
}

export function getCurrentUser() {
  return apiClient.get<MeResponse>('/api/auth/me');
}

export function loginRequest(payload: LoginRequest) {
  return apiClient.post<TokenResponse>('/api/auth/login', payload);
}

export function registerRequest(payload: RegisterRequest) {
  return apiClient.post<TokenResponse>('/api/auth/register', payload);
}
