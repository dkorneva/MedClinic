import { apiClient } from './client';

export type UserRole = 'Patient' | 'Doctor' | 'Admin';

export interface UserResponse {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export function getUsers() {
  return apiClient.get<UserResponse[]>('/api/users');
}

export function updateUserRole(id: string, request: UpdateUserRoleRequest) {
  return apiClient.put<UserResponse>(`/api/users/${id}/role`, request);
}
