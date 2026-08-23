import { useQuery } from '@tanstack/react-query';
import { Button, Space, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api/http/client';
import { getMyDoctorSchedule, type DoctorScheduleSlot } from '../../entities/doctor';
import { getTickets } from '../../entities/ticket';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import {
  colFlexStyle,
  complaintStyle,
  dayStyle,
  headerStyle,
  mainRowStyle,
  patientNameStyle,
  rowBetweenStyle,
  scheduleTextStyle,
  subtitleStyle,
  timeStyle,
  titleStyle,
} from './DoctorMain.styles';
import { useAuth } from '../../contexts/AuthContext';

export default function DoctorMain() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const newTicketsQuery = useQuery({
    queryKey: ['doctor-home-new-tickets'],
    queryFn: () => getTickets({ status: 'New', unassignedOnly: true, page: 1, pageSize: 100 }),
  });

  const scheduleQuery = useQuery({
    queryKey: ['doctor-own-schedule'],
    queryFn: getMyDoctorSchedule,
  });

  if (newTicketsQuery.isLoading || scheduleQuery.isLoading) {
    return <PageLoading />;
  }

  if (newTicketsQuery.isError || scheduleQuery.isError) {
    const error = newTicketsQuery.error ?? scheduleQuery.error;
    return <PageError message={error instanceof ApiError ? error.message : undefined} />;
  }

  const todayPatients = (newTicketsQuery.data?.items ?? [])
    .filter((ticket) => isSameLocalDate(ticket.appointmentAt, new Date()))
    .sort((a, b) => new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime())
    .map((ticket) => ({
      key: ticket.id,
      name: ticket.author.displayName,
      time: formatTime(ticket.appointmentAt),
      service: ticket.categoryName,
    }));

  const weekRows = buildWeekRows(scheduleQuery.data ?? []);

  const patientsColumns = [
    {
      title: 'Пациенты на сегодня',
      dataIndex: 'patient',
      key: 'patient',
      render: (_: unknown, record: { name: string; time: string; service: string }) => (
        <div style={rowBetweenStyle}>
          <div>
            <div style={patientNameStyle}>{record.name}</div>
            <div style={timeStyle}>{record.time}</div>
            <div style={complaintStyle}>{record.service}</div>
          </div>
        </div>
      ),
    },
  ];

  const scheduleColumns = [
    {
      title: 'Расписание',
      dataIndex: 'schedule',
      key: 'schedule',
      render: (_: unknown, record: { day: string; text: string }) => (
        <div style={rowBetweenStyle}>
          <span style={dayStyle}>{record.day}</span>
          <span style={scheduleTextStyle}>{record.text}</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={headerStyle}>
        <div style={titleStyle}>Добрый день, {user?.displayName ?? 'врач'}!</div>
        <div style={subtitleStyle}>Здесь показаны новые приёмы на сегодня и ваше актуальное расписание.</div>
        <Space>
          <Button type="primary" onClick={() => navigate('/doctor/queue/assigned')}>
            Текущие приёмы
          </Button>
          <Button onClick={() => navigate('/doctor/schedule')}>Расписание</Button>
        </Space>
      </div>

      <div style={mainRowStyle}>
        <div style={colFlexStyle}>
          <Table
            columns={patientsColumns}
            dataSource={todayPatients}
            pagination={false}
            locale={{ emptyText: 'На сегодня новых приёмов нет' }}
          />
        </div>

        <div style={colFlexStyle}>
          <Table
            columns={scheduleColumns}
            dataSource={weekRows}
            pagination={false}
            locale={{ emptyText: 'В расписании пока нет слотов' }}
          />
        </div>
      </div>
    </div>
  );
}

function buildWeekRows(slots: DoctorScheduleSlot[]) {
  const groups = new Map<string, DoctorScheduleSlot[]>();

  slots.forEach((slot) => {
    const key = new Date(slot.startAt).toLocaleDateString('sv-SE');
    const current = groups.get(key) ?? [];
    current.push(slot);
    groups.set(key, current);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 5)
    .map(([key, daySlots]) => {
      const date = new Date(daySlots[0].startAt);
      const bookedCount = daySlots.filter((slot) => slot.isBooked).length;
      const totalCount = daySlots.length;

      return {
        key,
        day: date.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        text: bookedCount > 0 ? `Записей: ${bookedCount} из ${totalCount}` : `Свободных слотов: ${totalCount}`,
      };
    });
}

function isSameLocalDate(value: string, date: Date) {
  const target = new Date(value);

  return (
    target.getFullYear() === date.getFullYear() &&
    target.getMonth() === date.getMonth() &&
    target.getDate() === date.getDate()
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
