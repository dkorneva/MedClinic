import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Descriptions, Input, Modal, Select, Space, Table, Typography, message } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../shared/api/http/client';
import { getDiagnoses } from '../entities/diagnosis';
import {
  assignTicket,
  changeTicketStatus,
  getTickets,
  rejectTicket,
  updateMedicalRecord,
  type PagedResponse,
  type TicketResponse,
  type TicketStatus,
  type TicketsQuery,
} from '../entities/ticket';
import PageEmpty from './PageEmpty';
import PageError from './PageError';
import PageLoading from './PageLoading';
import TicketPriorityTag from './TicketPriorityTag';
import TicketStatusTag from './TicketStatusTag';

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

type QueueMode = 'new' | 'assigned' | 'resolved';
type RecordMode = 'edit' | 'view';

interface Props {
  title: string;
  description: string;
  mode: QueueMode;
}

const CURRENT_STATUS_FILTER_OPTIONS: Array<{ label: string; value: TicketStatus }> = [
  { label: 'Новая', value: 'New' },
  { label: 'В работе', value: 'InProgress' },
];

function getBaseQuery(mode: QueueMode): TicketsQuery {
  switch (mode) {
    case 'new':
      return { status: 'New', unassignedOnly: true };
    case 'assigned':
      return { assignedToMe: true };
    case 'resolved':
      return { assignedToMe: true, status: 'Resolved' };
  }
}

export default function TicketQueueTable({ title, description, mode }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1); // 1 - начальная страница
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(mode === 'assigned' ? undefined : getBaseQuery(mode).status);
  const [rejectTicketId, setRejectTicketId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [medicalRecordTicket, setMedicalRecordTicket] = useState<TicketResponse | null>(null);
  const [recordMode, setRecordMode] = useState<RecordMode>('edit');
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<number | undefined>();
  const [treatment, setTreatment] = useState('');

  const queryParams = useMemo<TicketsQuery>(
    () => ({
      ...getBaseQuery(mode),
      status: mode === 'assigned' ? statusFilter : getBaseQuery(mode).status,
      page,
      pageSize,
    }),
    [mode, page, pageSize, statusFilter],
  );

  const ticketsQuery = useQuery({
    queryKey: ['doctor-queues', mode, queryParams],
    queryFn: async (): Promise<PagedResponse<TicketResponse>> => {
      if (mode === 'assigned') {
        const [newTickets, inProgressTickets] = await Promise.all([
          getTickets({ assignedToMe: true, status: 'New', page: 1, pageSize: 100 }),
          getTickets({ assignedToMe: true, status: 'InProgress', page: 1, pageSize: 100 }),
        ]);

        const items = [...newTickets.items, ...inProgressTickets.items]
          .filter((ticket) => (statusFilter ? ticket.status === statusFilter : true))
          .sort((left, right) => new Date(left.appointmentAt).getTime() - new Date(right.appointmentAt).getTime());

        return {
          items,
          total: items.length,
          page: 1,
          pageSize: items.length || pageSize,
        };
      }

      if (mode !== 'resolved') {
        return getTickets(queryParams);
      }

      const [resolved, rejected] = await Promise.all([
        getTickets({ assignedToMe: true, status: 'Resolved', page: 1, pageSize: 100 }),
        getTickets({ assignedToMe: true, status: 'Rejected', page: 1, pageSize: 100 }),
      ]);

      const items = [...resolved.items, ...rejected.items].sort(
        (left, right) => new Date(right.appointmentAt).getTime() - new Date(left.appointmentAt).getTime(),
      );

      return {
        items,
        total: items.length,
        page: 1,
        pageSize: items.length || pageSize,
      };
    },
  });

  const diagnosesQuery = useQuery({
    queryKey: ['diagnoses', medicalRecordTicket?.doctorSpecialty],
    queryFn: () => getDiagnoses(medicalRecordTicket?.doctorSpecialty),
    enabled: Boolean(medicalRecordTicket?.doctorSpecialty && recordMode === 'edit'),
  });

  useEffect(() => {
    if (!medicalRecordTicket) {
      setSelectedDiagnosisId(undefined);
      setTreatment('');
      return;
    }

    setSelectedDiagnosisId(medicalRecordTicket.diagnosisId ?? undefined);
    setTreatment(medicalRecordTicket.treatment ?? '');
  }, [medicalRecordTicket]);

  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['doctor-queues'] });
    await queryClient.invalidateQueries({ queryKey: ['ticket'] });
  };

  const assignMutation = useMutation({
    mutationFn: assignTicket,
    onSuccess: async () => {
      await refreshData();
      void message.success('Запись назначена вам и переведена в работу.');
    },
    onError: (error) => {
      void message.error(resolveApiError(error, 'Не удалось назначить запись.'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TicketStatus }) => changeTicketStatus(id, status),
    onSuccess: async (updatedTicket) => {
      updateDoctorQueueCaches(queryClient, updatedTicket);
      await refreshData();
      void message.success('Статус записи обновлён.');
    },
    onError: (error) => {
      void message.error(resolveApiError(error, 'Не удалось изменить статус записи.'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectTicket(id, reason),
    onSuccess: async () => {
      setRejectTicketId(null);
      setRejectReason('');
      await refreshData();
      void message.success('Запись отклонена.');
    },
    onError: (error) => {
      void message.error(resolveApiError(error, 'Не удалось отклонить запись.'));
    },
  });

  const medicalRecordMutation = useMutation({
    mutationFn: ({ id, diagnosisId, nextTreatment }: { id: number; diagnosisId: number; nextTreatment: string }) =>
      updateMedicalRecord(id, { diagnosisId, treatment: nextTreatment }),
    onSuccess: async () => {
      setMedicalRecordTicket(null);
      await refreshData();
      void message.success('Медицинская карта обновлена.');
    },
    onError: (error) => {
      void message.error(resolveApiError(error, 'Не удалось сохранить медицинскую карту.'));
    },
  });

  if (ticketsQuery.isLoading) {
    return <PageLoading />;
  }

  if (ticketsQuery.isError) {
    return <PageError message={ticketsQuery.error instanceof ApiError ? ticketsQuery.error.message : undefined} />;
  }

  const tickets = ticketsQuery.data?.items ?? [];
  const total = ticketsQuery.data?.total ?? 0;

  const columns: TableProps<TicketResponse>['columns'] = [
    { title: 'Услуга', dataIndex: 'categoryName', key: 'categoryName' },
    { title: 'Пациент', dataIndex: ['author', 'displayName'], key: 'author' },
    {
      title: 'Дата приёма',
      dataIndex: 'appointmentAt',
      key: 'appointmentAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('ru-RU', DATE_FORMAT),
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

  if (mode === 'assigned' || mode === 'resolved') {
    columns.splice(
      3,
      0,
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
    );
  }

  columns.push({
    title: 'Действия',
    key: 'actions',
    width: mode === 'assigned' ? 300 : mode === 'new' ? 320 : 180,
    render: (_, ticket) => (
      <Space onClick={(event) => event.stopPropagation()} wrap>
        {mode === 'new' && (
          <>
            <Button
              type="primary"
              loading={assignMutation.isPending && assignMutation.variables === ticket.id}
              onClick={() => assignMutation.mutate(ticket.id)}
            >
              Взять в работу
            </Button>
            <Button danger onClick={() => setRejectTicketId(ticket.id)}>
              Отклонить
            </Button>
          </>
        )}
        {mode === 'assigned' && (
          <>
            <Button
              onClick={() => {
                setRecordMode('edit');
                setMedicalRecordTicket(ticket);
              }}
            >
              Карта
            </Button>
            <Select
              placeholder="Сменить статус"
              style={{ width: 170 }}
              value={undefined}
              options={getStatusOptions(ticket.status)}
              onChange={(status) => {
                if (!status) {
                  return;
                }

                if (status === 'Resolved' && (!ticket.diagnosisId || !ticket.treatment?.trim())) {
                  void message.warning('Перед завершением приёма заполните диагноз и назначенное лечение.');
                  return;
                }

                statusMutation.mutate({ id: ticket.id, status });
              }}
            />
          </>
        )}
        {mode === 'resolved' && <Button onClick={() => navigate(`/tickets/${ticket.id}`)}>Карта</Button>}
      </Space>
    ),
  });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </div>

      {mode === 'assigned' && (
        <Select
          allowClear
          placeholder="Фильтр по статусу"
          style={{ width: 240 }}
          options={CURRENT_STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        />
      )}

      {tickets.length === 0 ? (
        <PageEmpty description="Подходящих записей пока нет" />
      ) : (
        <Table<TicketResponse>
          rowKey="id"
          columns={columns}
          dataSource={tickets}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: mode !== 'resolved',
            pageSizeOptions: ['10', '20', '50'],
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      )}

      <Modal
        title="Причина отклонения записи"
        open={rejectTicketId !== null}
        okText="Отклонить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
        confirmLoading={rejectMutation.isPending}
        onCancel={() => {
          setRejectTicketId(null);
          setRejectReason('');
        }}
        onOk={() => {
          if (!rejectTicketId || !rejectReason.trim()) {
            void message.warning('Укажите причину отклонения.');
            return;
          }

          rejectMutation.mutate({ id: rejectTicketId, reason: rejectReason.trim() });
        }}
      >
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Например: требуется повторная запись через администратора"
        />
      </Modal>

      <Modal
        title="Медицинская карта"
        open={medicalRecordTicket !== null}
        okText={recordMode === 'edit' ? 'Сохранить' : 'Открыть запись'}
        cancelText="Закрыть"
        confirmLoading={medicalRecordMutation.isPending}
        onCancel={() => setMedicalRecordTicket(null)}
        onOk={() => {
          if (!medicalRecordTicket) {
            return;
          }

          if (recordMode === 'view') {
            navigate(`/tickets/${medicalRecordTicket.id}`);
            return;
          }

          if (!selectedDiagnosisId || !treatment.trim()) {
            void message.warning('Выберите диагноз и заполните назначенное лечение.');
            return;
          }

          medicalRecordMutation.mutate({
            id: medicalRecordTicket.id,
            diagnosisId: selectedDiagnosisId,
            nextTreatment: treatment.trim(),
          });
        }}
      >
        {medicalRecordTicket && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Пациент">{medicalRecordTicket.author.displayName}</Descriptions.Item>
              <Descriptions.Item label="Услуга">{medicalRecordTicket.categoryName}</Descriptions.Item>
              <Descriptions.Item label="Специальность врача">{medicalRecordTicket.doctorSpecialty}</Descriptions.Item>
              <Descriptions.Item label="Врач">{medicalRecordTicket.doctorFullName}</Descriptions.Item>
              <Descriptions.Item label="Дата и время приёма">
                {new Date(medicalRecordTicket.appointmentAt).toLocaleString('ru-RU', DATE_FORMAT)}
              </Descriptions.Item>
              <Descriptions.Item label="Жалоба">
                <span style={{ whiteSpace: 'pre-wrap' }}>{medicalRecordTicket.description}</span>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Typography.Text strong>Диагноз</Typography.Text>
              <Select
                showSearch
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Выберите диагноз"
                optionFilterProp="label"
                loading={diagnosesQuery.isLoading}
                disabled={recordMode !== 'edit'}
                value={selectedDiagnosisId}
                options={(diagnosesQuery.data ?? []).map((diagnosis) => ({
                  value: diagnosis.id,
                  label: diagnosis.name,
                }))}
                onChange={(value) => setSelectedDiagnosisId(value)}
              />
            </div>

            <div>
              <Typography.Text strong>Назначенное лечение</Typography.Text>
              <Input.TextArea
                rows={5}
                value={treatment}
                disabled={recordMode !== 'edit'}
                onChange={(event) => setTreatment(event.target.value)}
                placeholder="Опишите назначения, рекомендации и план лечения"
                style={{ marginTop: 8 }}
              />
            </div>
          </Space>
        )}
      </Modal>
    </Space>
  );
}

function getStatusOptions(currentStatus: TicketStatus) {
  if (currentStatus === 'New') {
    return [{ label: 'В работе', value: 'InProgress' as TicketStatus }];
  }

  if (currentStatus === 'InProgress') {
    return [{ label: 'Завершена', value: 'Resolved' as TicketStatus }];
  }

  return [];
}

function updateDoctorQueueCaches(queryClient: ReturnType<typeof useQueryClient>, updatedTicket: TicketResponse) {
  const queueQueries = queryClient.getQueriesData<PagedResponse<TicketResponse>>({ queryKey: ['doctor-queues'] });

  queueQueries.forEach(([queryKey, data]) => {
    if (!data || !Array.isArray(queryKey)) {
      return;
    }

    const mode = queryKey[1];

    if (mode === 'assigned') {
      const queryParams = queryKey[2] as TicketsQuery | undefined;
      const shouldInclude =
        updatedTicket.status === 'New' || updatedTicket.status === 'InProgress'
          ? !queryParams?.status || queryParams.status === updatedTicket.status
          : false;

      queryClient.setQueryData<PagedResponse<TicketResponse>>(
        queryKey,
        updatePagedTickets(data, updatedTicket, shouldInclude, sortByAppointmentAsc),
      );
      return;
    }

    if (mode === 'resolved') {
      const shouldInclude = updatedTicket.status === 'Resolved' || updatedTicket.status === 'Rejected';

      queryClient.setQueryData<PagedResponse<TicketResponse>>(
        queryKey,
        updatePagedTickets(data, updatedTicket, shouldInclude, sortByAppointmentDesc),
      );
      return;
    }

    if (mode === 'new') {
      const shouldInclude = updatedTicket.status === 'New' && !updatedTicket.assignee;

      queryClient.setQueryData<PagedResponse<TicketResponse>>(
        queryKey,
        updatePagedTickets(data, updatedTicket, shouldInclude, sortByAppointmentAsc),
      );
    }
  });
}

function updatePagedTickets(
  data: PagedResponse<TicketResponse>,
  updatedTicket: TicketResponse,
  shouldInclude: boolean,
  sortTickets: (left: TicketResponse, right: TicketResponse) => number,
): PagedResponse<TicketResponse> {
  const itemsWithoutTicket = data.items.filter((ticket) => ticket.id !== updatedTicket.id);
  const nextItems = shouldInclude ? [...itemsWithoutTicket, updatedTicket].sort(sortTickets) : itemsWithoutTicket;

  return {
    ...data,
    items: nextItems,
    total: nextItems.length,
    pageSize: nextItems.length || data.pageSize,
  };
}

function sortByAppointmentAsc(left: TicketResponse, right: TicketResponse) {
  return new Date(left.appointmentAt).getTime() - new Date(right.appointmentAt).getTime();
}

function sortByAppointmentDesc(left: TicketResponse, right: TicketResponse) {
  return new Date(right.appointmentAt).getTime() - new Date(left.appointmentAt).getTime();
}

function resolveApiError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'Запись уже назначена другому врачу.';
    }

    return error.message;
  }

  return fallback;
}
