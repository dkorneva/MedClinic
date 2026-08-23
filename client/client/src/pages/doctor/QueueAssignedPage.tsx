import TicketQueueTable from '../../components/TicketQueueTable';

export default function QueueAssignedPage() {
  return (
    <TicketQueueTable
      mode="assigned"
      title="Текущие приёмы"
      description="Ведите текущие приёмы, заполняйте диагноз и назначенное лечение перед завершением записи."
    />
  );
}
