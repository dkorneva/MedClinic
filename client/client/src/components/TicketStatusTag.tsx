import { Tag } from 'antd';
import type { TicketStatus } from '../entities/ticket';

const STATUS_CONFIG: Record<TicketStatus, { color: string; label: string }> = {
  New: { color: 'blue', label: 'Новая' },
  InProgress: { color: 'processing', label: 'В работе' },
  Resolved: { color: 'green', label: 'Завершена' },
  Closed: { color: 'default', label: 'Закрыт' },
  Rejected: { color: 'red', label: 'Отменена' },
};

interface Props {
  status: TicketStatus;
}

export default function TicketStatusTag({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? { color: 'default', label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}
