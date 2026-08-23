import TicketQueueTable from '../../components/TicketQueueTable';

export default function QueueNewPage() {
  return (
    <TicketQueueTable
      mode="new"
      title="Новые записи"
      description="Здесь отображаются только новые записи пациентов, оформленные именно к вам."
    />
  );
}
