import { Tag } from 'antd';
import type { TicketPriority } from '../entities/ticket';

const PRIORITY_CONFIG: Record<TicketPriority, { color: string; label: string }> = {
  Low: { color: 'default', label: 'Низкий' },
  Medium: { color: 'orange', label: 'Средний' },
  High: { color: 'red', label: 'Высокий' },
};

interface Props {
  priority: TicketPriority;
}

export default function TicketPriorityTag({ priority }: Props) {
  const config = PRIORITY_CONFIG[priority] ?? { color: 'default', label: priority };
  return <Tag color={config.color}>{config.label}</Tag>;
}
