import { apiClient } from './client';

export interface DiagnosisResponse {
  id: number;
  name: string;
  specialty: string;
}

export function getDiagnoses(specialty?: string) {
  const query = specialty ? `?specialty=${encodeURIComponent(specialty)}` : '';
  return apiClient.get<DiagnosisResponse[]>(`/api/diagnoses${query}`);
}
