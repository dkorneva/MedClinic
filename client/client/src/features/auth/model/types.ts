export type Role = 'Patient' | 'Doctor' | 'Admin';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface MeResponse {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface TokenResponse {
  accessToken: string;
}
