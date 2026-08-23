import { apiClient } from './client';

export interface AdminDashboardAppointment {
  ticketId: number;
  appointmentAt: string;
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  categoryName: string;
  status: string;
}

export interface AdminDoctorLoad {
  doctorId: number;
  doctorName: string;
  specialty: string;
  totalSlots: number;
  bookedSlots: number;
  loadPercent: number;
}

export interface AdminDashboard {
  totalDoctors: number;
  activeDoctors: number;
  activeCategories: number;
  todayAppointmentsCount: number;
  newAppointmentsCount: number;
  inProgressAppointmentsCount: number;
  completedAppointmentsCount: number;
  todayRevenue: number;
  todayAppointments: AdminDashboardAppointment[];
  doctorLoads: AdminDoctorLoad[];
}

export interface AdminMonthlyRevenue {
  monthKey: string;
  revenue: number;
  appointmentsCount: number;
}

export interface AdminDailyRevenue {
  dateKey: string;
  revenue: number;
}

export interface AdminStatusStat {
  status: string;
  count: number;
}

export interface AdminReports {
  start: string;
  end: string;
  revenue: number;
  totalAppointments: number;
  completedAppointments: number;
  rejectedAppointments: number;
  newPatients: number;
  activeDoctors: number;
  completionRate: number;
  currentMonthRevenueByDay: AdminDailyRevenue[];
  revenueByMonth: AdminMonthlyRevenue[];
  statuses: AdminStatusStat[];
  doctorLoads: AdminDoctorLoad[];
}

function buildQuery(params: { start?: string; end?: string } = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getAdminDashboard() {
  return apiClient.get<AdminDashboard>('/api/admin/dashboard');
}

export function getAdminReports(params?: { start?: string; end?: string }) {
  return apiClient.get<AdminReports>(`/api/admin/reports${buildQuery(params)}`);
}
