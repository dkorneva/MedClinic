export type {
  Doctor,
  DoctorListQuery,
  DoctorPayload,
  DoctorScheduleSlot,
  DoctorStatus,
  DoctorTimeSlot,
} from '../../api/doctors';
export {
  createDoctor,
  deleteDoctor,
  getDoctors,
  getDoctorSchedule,
  getDoctorSlots,
  getDoctorSpecialties,
  getMyDoctorSchedule,
  updateDoctor,
  updateDoctorSchedule,
} from '../../api/doctors';
