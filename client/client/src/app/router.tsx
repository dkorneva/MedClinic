import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PageNotFound from '../components/PageNotFound';
import { RequireAuth } from '../components/RequireAuth';
import { RequireRole } from '../components/RequireRole';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import TicketDetailPage from '../pages/TicketDetailPage';
import AdminDoctors from '../pages/admin/AdminDoctors';
import AdminMain from '../pages/admin/AdminMain';
import AdminPatients from '../pages/admin/AdminPatients';
import AdminReports from '../pages/admin/AdminReports';
import AdminSchedule from '../pages/admin/AdminSchedule';
import CategoriesPage from '../pages/admin/CategoriesPage';
import UsersPage from '../pages/admin/UsersPage';
import DoctorMain from '../pages/doctor/DoctorMain';
import DoctorSchedule from '../pages/doctor/DoctorSchedule';
import QueueAssignedPage from '../pages/doctor/QueueAssignedPage';
import QueueNewPage from '../pages/doctor/QueueNewPage';
import QueueResolvedPage from '../pages/doctor/QueueResolvedPage';
import NewTicketPage from '../pages/patient/NewTicketPage';
import PatientAppointment from '../pages/patient/PatientAppointment';
import PatientMain from '../pages/patient/PatientMain';
import PatientViewAppointments from '../pages/patient/PatientViewAppointments';
import TicketsPage from '../pages/patient/TicketsPage';
import { RootRedirect } from './RootRedirect';
import { APP_ROUTES } from './routes';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={APP_ROUTES.login} element={<LoginPage />} />
        <Route path={APP_ROUTES.register} element={<RegisterPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path={APP_ROUTES.patientMain} element={<RequireRole roles={['Patient']}><PatientMain /></RequireRole>} />
          <Route path={APP_ROUTES.patientAppointment} element={<RequireRole roles={['Patient']}><PatientAppointment /></RequireRole>} />
          <Route path={APP_ROUTES.patientAppointments} element={<RequireRole roles={['Patient']}><PatientViewAppointments /></RequireRole>} />
          <Route path={APP_ROUTES.patientTickets} element={<RequireRole roles={['Patient']}><TicketsPage /></RequireRole>} />
          <Route path={APP_ROUTES.patientNewTicket} element={<RequireRole roles={['Patient']}><NewTicketPage /></RequireRole>} />
          <Route path={APP_ROUTES.ticketDetail} element={<RequireRole roles={['Patient', 'Doctor', 'Admin']}><TicketDetailPage /></RequireRole>} />
          <Route path={APP_ROUTES.appointmentDetail} element={<RequireRole roles={['Patient', 'Doctor']}><TicketDetailPage /></RequireRole>} />
          <Route path={APP_ROUTES.doctorMain} element={<RequireRole roles={['Doctor']}><DoctorMain /></RequireRole>} />
          <Route path={APP_ROUTES.doctorSchedule} element={<RequireRole roles={['Doctor']}><DoctorSchedule /></RequireRole>} />
          <Route path={APP_ROUTES.doctorQueueNew} element={<RequireRole roles={['Doctor']}><QueueNewPage /></RequireRole>} />
          <Route path={APP_ROUTES.doctorQueueAssigned} element={<RequireRole roles={['Doctor']}><QueueAssignedPage /></RequireRole>} />
          <Route path={APP_ROUTES.doctorQueueResolved} element={<RequireRole roles={['Doctor']}><QueueResolvedPage /></RequireRole>} />
          <Route path={APP_ROUTES.adminMain} element={<RequireRole roles={['Admin']}><AdminMain /></RequireRole>} />
          <Route path={APP_ROUTES.adminSchedule} element={<RequireRole roles={['Admin']}><AdminSchedule /></RequireRole>} />
          <Route path={APP_ROUTES.adminPatients} element={<RequireRole roles={['Admin']}><AdminPatients /></RequireRole>} />
          <Route path={APP_ROUTES.adminDoctors} element={<RequireRole roles={['Admin']}><AdminDoctors /></RequireRole>} />
          <Route path={APP_ROUTES.adminReports} element={<RequireRole roles={['Admin']}><AdminReports /></RequireRole>} />
          <Route path={APP_ROUTES.adminCategories} element={<RequireRole roles={['Admin']}><CategoriesPage /></RequireRole>} />
          <Route path={APP_ROUTES.adminUsers} element={<RequireRole roles={['Admin']}><UsersPage /></RequireRole>} />
        </Route>
        <Route path={APP_ROUTES.root} element={<RootRedirect />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
