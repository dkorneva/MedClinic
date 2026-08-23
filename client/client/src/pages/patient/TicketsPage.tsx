import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Space, Table, Typography } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api/http/client';
import { getCategories } from '../../entities/category';
import { getTickets, type TicketResponse, type TicketStatus } from '../../entities/ticket';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import TicketPriorityTag from '../../components/TicketPriorityTag';
import TicketStatusTag from '../../components/TicketStatusTag';

const STATUS_OPTIONS: Array<{ value: TicketStatus; label: string }> = [
  { value: 'New', label: 'Новая' },
  { value: 'InProgress', label: 'В работе' },
  { value: 'Resolved', label: 'Завершена' },
  { value: 'Rejected', label: 'Отменена' },
];

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export default function TicketsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TicketStatus | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const ticketsQuery = useQuery({
    queryKey: ['patient-tickets', { status, categoryId, page, pageSize }],
    queryFn: () => getTickets({ status, categoryId, page, pageSize }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: () => getCategories(false),
  });

  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [categoriesQuery.data],
  );

  const columns: TableProps<TicketResponse>['columns'] = [
    {
      title: 'Услуга',
      dataIndex: 'categoryName',
      key: 'categoryName',
    },
    {
      title: 'Специальность',
      dataIndex: 'doctorSpecialty',
      key: 'doctorSpecialty',
    },
    {
      title: 'Врач',
      dataIndex: 'doctorFullName',
      key: 'doctorFullName',
    },
    {
      title: 'Дата и время',
      dataIndex: 'appointmentAt',
      key: 'appointmentAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('ru-RU', DATE_FORMAT),
    },
    {
      title: 'Диагноз',
      dataIndex: 'diagnosisName',
      key: 'diagnosisName',
      render: (value?: string | null) => value || 'Не указан',
    },
    {
      title: 'Назначенное лечение',
      dataIndex: 'treatment',
      key: 'treatment',
      render: (value?: string | null) => value || 'Не назначено',
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 140,
      render: (value) => <TicketPriorityTag priority={value} />,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value) => <TicketStatusTag status={value} />,
    },
  ];

  if (ticketsQuery.isLoading) {
    return <PageLoading />;
  }

  if (ticketsQuery.isError) {
    return <PageError message={ticketsQuery.error instanceof ApiError ? ticketsQuery.error.message : undefined} />;
  }

  const tickets = ticketsQuery.data?.items ?? [];
  const total = ticketsQuery.data?.total ?? 0;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Мои записи
        </Typography.Title>
        <Typography.Text type="secondary">
          Здесь отображаются ваши записи на приём в клинику, включая диагноз и назначенное лечение.
        </Typography.Text>
      </div>

      <Space wrap>
        <Select
          allowClear
          placeholder="Статус"
          style={{ width: 220 }}
          options={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Услуга"
          style={{ width: 280 }}
          options={categoryOptions}
          value={categoryId}
          loading={categoriesQuery.isLoading}
          onChange={(value) => {
            setCategoryId(value);
            setPage(1);
          }}
        />
      </Space>

      {tickets.length === 0 ? (
        <PageEmpty description="Записи пока не найдены" />
      ) : (
        <Table<TicketResponse>
          rowKey="id"
          columns={columns}
          dataSource={tickets}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/tickets/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      )}
    </Space>
  );
}
