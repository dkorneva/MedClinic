import TicketQueueTable from '../../components/TicketQueueTable';

export default function QueueResolvedPage() {
  return (
    <TicketQueueTable
      mode="resolved"
      title="Завершённые приёмы"
      description="Заполняйте карту завершённого приёма: выбирайте диагноз и фиксируйте назначенное лечение."
    />
  );
}
