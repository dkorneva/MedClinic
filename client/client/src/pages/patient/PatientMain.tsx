import { Button, Space, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api/http/client';
import { getTickets, type TicketResponse } from '../../entities/ticket';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import TicketStatusTag from '../../components/TicketStatusTag';
import { useAuth } from '../../contexts/AuthContext';
import {
  colFlexStyle,
  headerStyle,
  mainRowStyle,
  subtitleStyle,
  titleStyle,
} from './PatientMain.styles';

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export default function PatientMain() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const ticketsQuery = useQuery({
    queryKey: ['patient-main-upcoming'],
    queryFn: () => getTickets({ page: 1, pageSize: 100 }),
  });

  if (ticketsQuery.isLoading) {
    return <PageLoading />;
  }

  if (ticketsQuery.isError) {
    return (
      <PageError
        message={ticketsQuery.error instanceof ApiError ? ticketsQuery.error.message : undefined}
      />
    );
  }

  const upcomingAppointments = (ticketsQuery.data?.items ?? [])
    .filter((ticket) => ['New', 'InProgress'].includes(ticket.status))
    .sort(
      (left, right) =>
        new Date(left.appointmentAt).getTime() - new Date(right.appointmentAt).getTime(),
    );

  const columns: TableColumnsType<TicketResponse> = [
    {
      title: 'Услуга',
      dataIndex: 'categoryName',
      key: 'categoryName',
    },
    {
      title: 'Врач',
      key: 'doctor',
      render: (_, record) => (
        <div>
          <div>{record.doctorFullName}</div>
          <div style={{ color: '#8C8C8C' }}>{record.doctorSpecialty}</div>
        </div>
      ),
    },
    {
      title: 'Дата и время',
      dataIndex: 'appointmentAt',
      key: 'appointmentAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('ru-RU', DATE_FORMAT),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <TicketStatusTag status={status as any} />,
    },
  ];

  return (
    <div>
      <div style={headerStyle}>
        <div style={titleStyle}>Добрый день, {user?.displayName ?? 'пациент'}!</div>
        <div style={subtitleStyle}>У вас {upcomingAppointments.length} предстоящих приёмов</div>
        <Space>
          <Button type="primary" onClick={() => navigate('/patient/tickets/new')}>
            Записаться на приём
          </Button>
          <Button onClick={() => navigate('/patient/tickets')}>Мои записи</Button>
        </Space>
      </div>

      <div style={mainRowStyle}>
        <div style={colFlexStyle}>
          {upcomingAppointments.length === 0 ? (
            <PageEmpty description="Предстоящих приёмов пока нет" />
          ) : (
            <Table<TicketResponse>
              rowKey="id"
              columns={columns}
              dataSource={upcomingAppointments}
              pagination={false}
              title={() => 'Предстоящие приёмы'}
              onRow={(record) => ({
                onClick: () => navigate(`/tickets/${record.id}`),
                style: { cursor: 'pointer' },
              })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
