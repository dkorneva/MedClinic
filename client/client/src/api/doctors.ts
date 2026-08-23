import { apiClient } from './client';

export type DoctorStatus = 'Active' | 'Vacation' | 'Inactive';

export interface Doctor {
  id: number;
  fullName: string;
  email: string;
  specialty: string;
  status: DoctorStatus;
}

export interface DoctorTimeSlot {
  id: number;
  startAt: string;
  isBooked: boolean;
}

export interface DoctorScheduleSlot {
  id: number;
  startAt: string;
  isBooked: boolean;
  ticketId?: number | null;
  patientName?: string | null;
  categoryName?: string | null;
  status?: string | null;
}

export interface DoctorListQuery {
  includeInactive?: boolean;
  specialty?: string;
}

export interface DoctorPayload {
  fullName: string;
  email: string;
  specialty: string;
  status: DoctorStatus;
  slots: string[];
}

function buildQuery(params: DoctorListQuery = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getDoctors(params?: DoctorListQuery) {
  return apiClient.get<Doctor[]>(`/api/doctors${buildQuery(params)}`);
}

export function getDoctorSpecialties() {
  return apiClient.get<string[]>('/api/doctors/specialties');
}

export function getDoctorSlots(doctorId: number) {
  return apiClient.get<DoctorTimeSlot[]>(`/api/doctors/${doctorId}/slots`);
}

export function getMyDoctorSchedule() {
  return apiClient.get<DoctorScheduleSlot[]>('/api/doctors/me/schedule');
}

export function getDoctorSchedule(doctorId: number) {
  return apiClient.get<DoctorScheduleSlot[]>(`/api/doctors/${doctorId}/schedule`);
}

export function updateDoctorSchedule(doctorId: number, slots: string[]) {
  return apiClient.put<DoctorScheduleSlot[]>(`/api/doctors/${doctorId}/schedule`, { slots });
}

export function createDoctor(payload: DoctorPayload) {
  return apiClient.post<Doctor>('/api/doctors', payload);
}

export function updateDoctor(id: number, payload: DoctorPayload) {
  return apiClient.put<Doctor>(`/api/doctors/${id}`, payload);
}

export function deleteDoctor(id: number) {
  return apiClient.delete<void>(`/api/doctors/${id}`);
}
