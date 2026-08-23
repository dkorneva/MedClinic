export type {
  CreateTicketRequest,
  PagedResponse,
  TicketPriority,
  TicketResponse,
  TicketStatus,
  TicketsQuery,
  UpdateMedicalRecordRequest,
  UserBriefResponse,
} from '../../api/tickets';
export {
  assignTicket,
  changeTicketStatus,
  createTicket,
  getTicketById,
  getTickets,
  rejectTicket,
  updateMedicalRecord,
} from '../../api/tickets';
