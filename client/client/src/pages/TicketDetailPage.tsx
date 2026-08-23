import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Descriptions, Input, Modal, Select, Space, Typography, message } from 'antd';
import { useParams } from 'react-router-dom';
import { ApiError } from '../shared/api/http/client';
import { getDiagnoses } from '../entities/diagnosis';
import {
  assignTicket,
  changeTicketStatus,
  getTicketById,
  rejectTicket,
  updateMedicalRecord,
  type TicketResponse,
  type TicketStatus,
} from '../entities/ticket';
import PageError from '../components/PageError';
import PageLoading from '../components/PageLoading';
import PageNotFound from '../components/PageNotFound';
import TicketPriorityTag from '../components/TicketPriorityTag';
import TicketStatusTag from '../components/TicketStatusTag';
import { useAuth } from '../contexts/AuthContext';

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);

  const ticketQuery = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicketById(ticketId),
    enabled: Number.isFinite(ticketId),
  });

  if (!Number.isFinite(ticketId)) {
    return <PageNotFound />;
  }

  if (ticketQuery.isLoading) {
    return <PageLoading />;
  }

  if (ticketQuery.isError) {
    if (ticketQuery.error instanceof ApiError && ticketQuery.error.status === 404) {
      return <PageNotFound />;
    }

    return <PageError message={ticketQuery.error instanceof ApiError ? ticketQuery.error.message : undefined} />;
  }

  const ticket = ticketQuery.data;
  if (!ticket) {
    return <PageNotFound />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {ticket.categoryName}
        </Typography.Title>
        <Typography.Text type="secondary">
          Детали записи пациента в частную медицинскую клинику.
        </Typography.Text>
      </div>

      <DoctorActions ticket={ticket} />

      <Descriptions bordered column={1}>
        <Descriptions.Item label="Статус">
          <TicketStatusTag status={ticket.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Приоритет">
          <TicketPriorityTag priority={ticket.priority} />
        </Descriptions.Item>
        <Descriptions.Item label="Услуга">{ticket.categoryName}</Descriptions.Item>
        <Descriptions.Item label="Специальность врача">{ticket.doctorSpecialty}</Descriptions.Item>
        <Descriptions.Item label="Врач">{ticket.doctorFullName}</Descriptions.Item>
        <Descriptions.Item label="Пациент">{ticket.author.displayName}</Descriptions.Item>
        <Descriptions.Item label="Дата и время приёма">
          {new Date(ticket.appointmentAt).toLocaleString('ru-RU', DATE_FORMAT)}
        </Descriptions.Item>
        <Descriptions.Item label="Дата создания">
          {new Date(ticket.createdAt).toLocaleString('ru-RU', DATE_FORMAT)}
        </Descriptions.Item>
        <Descriptions.Item label="Диагноз">{ticket.diagnosisName || 'Не указан'}</Descriptions.Item>
        <Descriptions.Item label="Назначенное лечение">
          <span style={{ whiteSpace: 'pre-wrap' }}>{ticket.treatment || 'Не назначено'}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Жалоба">
          <span style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</span>
        </Descriptions.Item>
      </Descriptions>
    </Space>
  );
}

function DoctorActions({ ticket }: { ticket: TicketResponse }) {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [recordOpen, setRecordOpen] = useState(false);
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<number | undefined>(ticket.diagnosisId ?? undefined);
  const [treatment, setTreatment] = useState(ticket.treatment ?? '');

  const diagnosesQuery = useQuery({
    queryKey: ['diagnoses', ticket.doctorSpecialty],
    queryFn: () => getDiagnoses(ticket.doctorSpecialty),
    enabled: role === 'Doctor' && !['Closed', 'Rejected'].includes(ticket.status),
  });

  if (role !== 'Doctor' || !user) {
    return null;
  }

  const isAssignee = ticket.assignee?.id === user.id;
  const isUnassigned = !ticket.assignee;
  const canAssign = isUnassigned && ticket.status === 'New';
  const canReject = ticket.status === 'New' && (isAssignee || isUnassigned);
  const canEditRecord = isAssignee && !['Closed', 'Rejected'].includes(ticket.status);
  const statusOptions = getStatusOptions(ticket.status, isAssignee);

  if (!canAssign && statusOptions.length === 0 && !canReject && !canEditRecord) {
    return null;
  }

  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
    await queryClient.invalidateQueries({ queryKey: ['doctor-queues'] });
  };

  const assignMutation = useMutation({
    mutationFn: () => assignTicket(ticket.id),
    onSuccess: async () => {
      await refreshData();
      void message.success('Запись назначена вам и переведена в работу.');
    },
    onError: (error) => {
      void message.error(resolveApiError(error, 'Не удалось назначить запись.'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => changeTicketStatus(ticket.id, status),
    onSuccess: async () => {
      await refreshData();
      void message.success('Статус записи обновлён.');
    },
    onError: (error) => {
      void message.error(resolveApiError(error, 'Не удалось изменить статус записи.'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectTicket(ticket.id, reason),
    onSuccess: async () => {
      setRejectOpen(false);
      setRejectReason('');
      await refreshData();
      void message.success('Запись отклонена.');
    },
    onError: (error) => {
      void message.error(resolveApiError(error, 'Не удалось отклонить запись.'));
    },
  });

  const medicalRecordMutation = useMutation({
    mutationFn: () => {
      if (!selectedDiagnosisId) {
        throw new Error('Выберите диагноз.');
      }

      return updateMedicalRecord(ticket.id, {
        diagnosisId: selectedDiagnosisId,
        treatment: treatment.trim(),
      });
    },
    onSuccess: async () => {
      setRecordOpen(false);
      await refreshData();
      void message.success('Медицинская карта обновлена.');
    },
    onError: (error) => {
      void message.error(error instanceof Error ? error.message : resolveApiError(error, 'Не удалось сохранить медицинскую карту.'));
    },
  });

  return (
    <>
      <Space wrap>
        {canAssign && (
          <Button type="primary" loading={assignMutation.isPending} onClick={() => assignMutation.mutate()}>
            Взять в работу
          </Button>
        )}
        {canEditRecord && (
          <Button onClick={() => setRecordOpen(true)}>{ticket.status === 'Resolved' ? 'Редактировать' : 'Карта'}</Button>
        )}
        {statusOptions.length > 0 && (
          <Select
            placeholder="Сменить статус"
            style={{ width: 180 }}
            value={undefined}
            options={statusOptions}
            onChange={(status) => {
              if (!status) {
                return;
              }

              if (status === 'Resolved' && (!ticket.diagnosisId || !ticket.treatment?.trim())) {
                void message.warning('Перед завершением приёма заполните диагноз и назначенное лечение.');
                return;
              }

              statusMutation.mutate(status);
            }}
          />
        )}
        {canReject && (
          <Button danger onClick={() => setRejectOpen(true)}>
            Отклонить
          </Button>
        )}
      </Space>

      <Modal
        title="Причина отклонения записи"
        open={rejectOpen}
        okText="Отклонить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
        confirmLoading={rejectMutation.isPending}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
        onOk={() => {
          if (!rejectReason.trim()) {
            void message.warning('Укажите причину отклонения.');
            return;
          }

          rejectMutation.mutate(rejectReason.trim());
        }}
      >
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Опишите причину отклонения записи"
        />
      </Modal>

      <Modal
        title="Медицинская карта"
        open={recordOpen}
        okText="Сохранить"
        cancelText="Закрыть"
        confirmLoading={medicalRecordMutation.isPending}
        onCancel={() => setRecordOpen(false)}
        onOk={() => {
          if (!selectedDiagnosisId || !treatment.trim()) {
            void message.warning('Выберите диагноз и заполните назначенное лечение.');
            return;
          }

          medicalRecordMutation.mutate();
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>Диагноз</Typography.Text>
            <Select
              showSearch
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Выберите диагноз"
              optionFilterProp="label"
              loading={diagnosesQuery.isLoading}
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
              onChange={(event) => setTreatment(event.target.value)}
              placeholder="Опишите назначения, рекомендации и план лечения"
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
}

function getStatusOptions(status: TicketStatus, isAssignee: boolean) {
  if (!isAssignee) {
    return [];
  }

  if (status === 'New') {
    return [{ label: 'В работе', value: 'InProgress' as TicketStatus }];
  }

  if (status === 'InProgress') {
    return [{ label: 'Завершена', value: 'Resolved' as TicketStatus }];
  }

  return [];
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
