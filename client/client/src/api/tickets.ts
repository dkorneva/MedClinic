import { apiClient } from './client';

export type TicketStatus = 'New' | 'InProgress' | 'Resolved' | 'Closed' | 'Rejected';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface UserBriefResponse {
  id: string;
  displayName: string;
}

export interface TicketResponse {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  appointmentAt: string;
  categoryId: number;
  categoryName: string;
  doctorSpecialty: string;
  doctorId: number;
  doctorFullName: string;
  doctorTimeSlotId: number;
  diagnosisId?: number | null;
  diagnosisName?: string | null;
  treatment?: string | null;
  author: UserBriefResponse;
  assignee?: UserBriefResponse | null;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TicketsQuery {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: number;
  assignedToMe?: boolean;
  unassignedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateTicketRequest {
  description: string;
  doctorSpecialty: string;
  categoryId: number;
  doctorId: number;
  doctorTimeSlotId: number;
  priority: TicketPriority;
}

export interface UpdateMedicalRecordRequest {
  diagnosisId: number;
  treatment: string;
}

function buildQuery(params: TicketsQuery = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getTickets(params?: TicketsQuery) {
  return apiClient.get<PagedResponse<TicketResponse>>(`/api/tickets${buildQuery(params)}`);
}

export function getTicketById(id: number) {
  return apiClient.get<TicketResponse>(`/api/tickets/${id}`);
}

export function createTicket(payload: CreateTicketRequest) {
  return apiClient.post<TicketResponse>('/api/tickets', payload);
}

export function assignTicket(id: number) {
  return apiClient.post<TicketResponse>(`/api/tickets/${id}/assign`);
}

export function changeTicketStatus(id: number, status: TicketStatus) {
  return apiClient.post<TicketResponse>(`/api/tickets/${id}/status`, { status });
}

export function rejectTicket(id: number, reason: string) {
  return apiClient.post<TicketResponse>(`/api/tickets/${id}/reject`, { reason });
}

export function updateMedicalRecord(id: number, payload: UpdateMedicalRecordRequest) {
  return apiClient.post<TicketResponse>(`/api/tickets/${id}/medical-record`, payload);
}

export const ticketsApi = {
  list: getTickets,
  getById: getTicketById,
  create: createTicket,
  assignToMe: assignTicket,
  changeStatus: changeTicketStatus,
  rejectTicket,
  updateMedicalRecord,
};
