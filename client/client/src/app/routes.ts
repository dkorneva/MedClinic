import type { Role } from '../features/auth';

export const APP_ROUTES = {
  root: '/',
  login: '/login',
  register: '/register',
  patientMain: '/patient/main',
  patientAppointment: '/patient/appointment',
  patientAppointments: '/patient/appointments',
  patientTickets: '/patient/tickets',
  patientNewTicket: '/patient/tickets/new',
  ticketDetail: '/tickets/:id',
  appointmentDetail: '/appointments/:id',
  doctorMain: '/doctor/main',
  doctorSchedule: '/doctor/schedule',
  doctorQueueNew: '/doctor/queue/new',
  doctorQueueAssigned: '/doctor/queue/assigned',
  doctorQueueResolved: '/doctor/queue/resolved',
  adminMain: '/admin/main',
  adminSchedule: '/admin/schedule',
  adminPatients: '/admin/patients',
  adminDoctors: '/admin/doctors',
  adminReports: '/admin/reports',
  adminCategories: '/admin/categories',
  adminUsers: '/admin/users',
} as const;

export function getDefaultRouteByRole(role: Role): string {
  switch (role) {
    case 'Patient':
      return APP_ROUTES.patientMain;
    case 'Doctor':
      return APP_ROUTES.doctorMain;
    case 'Admin':
      return APP_ROUTES.adminMain;
  }
}
