import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Calendar, Empty, Table } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ApiError } from '../../shared/api/http/client';
import { getMyDoctorSchedule } from '../../entities/doctor';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import {
  appointmentsColStyle,
  appointmentsTitleStyle,
  calendarColStyle,
  emptyStateWrapStyle,
  mainRowStyle,
  patientAgeStyle,
  patientCellRowStyle,
  patientNameStyle,
  titleStyle,
} from './DoctorSchedule.styles';

export default function DoctorSchedule() {
  const [selectedDateKey, setSelectedDateKey] = useState<string>('');

  const scheduleQuery = useQuery({
    queryKey: ['doctor-own-schedule'],
    queryFn: getMyDoctorSchedule,
  });

  useEffect(() => {
    if (!selectedDateKey && scheduleQuery.data?.length) {
      setSelectedDateKey(toDateKey(scheduleQuery.data[0].startAt));
    }
  }, [scheduleQuery.data, selectedDateKey]);

  if (scheduleQuery.isLoading) {
    return <PageLoading />;
  }

  if (scheduleQuery.isError) {
    return <PageError message={scheduleQuery.error instanceof ApiError ? scheduleQuery.error.message : undefined} />;
  }

  const schedule = scheduleQuery.data ?? [];
  const selectedDayRows = schedule
    .filter((slot) => toDateKey(slot.startAt) === selectedDateKey)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .map((slot) => ({
      key: slot.id,
      time: new Date(slot.startAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      patientName: slot.patientName,
      categoryName: slot.categoryName,
      status: slot.status,
      isBooked: slot.isBooked,
    }));

  const columns = [
    {
      title: 'Время',
      dataIndex: 'time',
      key: 'time',
      width: 120,
    },
    {
      title: 'Пациент и услуга',
      dataIndex: 'patient',
      key: 'patient',
      render: (_: unknown, record: { patientName?: string | null; categoryName?: string | null; isBooked: boolean }) => (
        <div style={patientCellRowStyle}>
          <div>
            <div style={patientNameStyle}>{record.patientName || 'Свободное окно'}</div>
            <div style={patientAgeStyle}>{record.categoryName || 'Свободный слот для записи'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (_: unknown, record: { status?: string | null; isBooked: boolean }) => renderScheduleStatus(record.status, record.isBooked),
    },
  ];

  return (
    <div>
      <h1 style={titleStyle}>Расписание</h1>

      <div style={mainRowStyle}>
        <div style={calendarColStyle}>
          <Calendar
            fullscreen={false}
            value={selectedDateKey ? dayjs(selectedDateKey) : undefined}
            onSelect={(value: Dayjs) => setSelectedDateKey(value.format('YYYY-MM-DD'))}
          />
        </div>

        <div style={appointmentsColStyle}>
          <h2 style={appointmentsTitleStyle}>Приёмы на выбранную дату</h2>
          {selectedDayRows.length > 0 ? (
            <Table columns={columns} dataSource={selectedDayRows} pagination={false} />
          ) : (
            <div style={emptyStateWrapStyle}>
              <Empty description="На выбранную дату слотов и приёмов нет" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toDateKey(value: string) {
  return dayjs(value).format('YYYY-MM-DD');
}

function renderScheduleStatus(status: string | null | undefined, isBooked: boolean) {
  if (!isBooked) {
    return <Badge status="default" text="Свободно" />;
  }

  if (status === 'Resolved') {
    return <Badge status="success" text="Завершена" />;
  }

  if (status === 'Rejected') {
    return <Badge status="error" text="Отменена" />;
  }

  if (status === 'InProgress') {
    return <Badge status="processing" text="В работе" />;
  }

  return <Badge status="warning" text="Новая запись" />;
}
