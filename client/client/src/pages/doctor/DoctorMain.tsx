import { type CSSProperties, useMemo, useState } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
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
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const newTicketsQuery = useQuery({
    queryKey: ['doctor-home-new-tickets'],
    queryFn: () => getTickets({ status: 'New', unassignedOnly: true, page: 1, pageSize: 100 }),
  });

  const scheduleQuery = useQuery({
    queryKey: ['doctor-own-schedule'],
    queryFn: getMyDoctorSchedule,
  });

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekRows = useMemo(
    () => buildWeekRows(scheduleQuery.data ?? [], weekStart),
    [scheduleQuery.data, weekStart],
  );

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
      title: (
        <div style={scheduleTitleStyle}>
          <span>Расписание</span>
          <span style={weekRangeStyle}>{formatWeekRange(weekStart, weekEnd)}</span>
          <Space.Compact>
            <Button
              aria-label="Предыдущая неделя"
              icon={<LeftOutlined />}
              size="small"
              style={weekArrowButtonStyle}
              onClick={() => setWeekStart((current) => addDays(current, -7))}
            />
            <Button
              aria-label="Следующая неделя"
              icon={<RightOutlined />}
              size="small"
              style={weekArrowButtonStyle}
              onClick={() => setWeekStart((current) => addDays(current, 7))}
            />
          </Space.Compact>
        </div>
      ),
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

function buildWeekRows(slots: DoctorScheduleSlot[], weekStart: Date) {
  const weekEnd = addDays(weekStart, 7);
  const groups = new Map<string, DoctorScheduleSlot[]>();

  slots
    .filter((slot) => {
      const slotDate = new Date(slot.startAt);
      return slotDate >= weekStart && slotDate < weekEnd;
    })
    .forEach((slot) => {
      const key = toDateKey(new Date(slot.startAt));
      const current = groups.get(key) ?? [];
      current.push(slot);
      groups.set(key, current);
    });

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const key = toDateKey(date);
    const daySlots = groups.get(key) ?? [];
    const bookedCount = daySlots.filter((slot) => slot.isBooked).length;
    const totalCount = daySlots.length;

    return {
      key,
      day: date.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      text:
        totalCount === 0
          ? 'Слотов нет'
          : bookedCount > 0
            ? `Записей: ${bookedCount} из ${totalCount}`
            : `Свободных слотов: ${totalCount}`,
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

function getWeekStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return start;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatWeekRange(start: Date, end: Date) {
  const from = start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  const to = end.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `Неделя ${from} - ${to}`;
}

const scheduleTitleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  width: '100%',
};

const weekRangeStyle: CSSProperties = {
  marginLeft: 'auto',
  color: 'rgba(0, 0, 0, 0.45)',
  fontWeight: 400,
};

const weekArrowButtonStyle: CSSProperties = {
  width: 28,
  height: 24,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
};
