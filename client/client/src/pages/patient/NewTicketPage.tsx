import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Tooltip,
  Typography,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api/http/client';
import { getCategories } from '../../entities/category';
import {
  getDoctors,
  getDoctorSlots,
  getDoctorSpecialties,
  type DoctorTimeSlot,
} from '../../entities/doctor';
import { createTicket, type CreateTicketRequest, type TicketPriority } from '../../entities/ticket';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import { useDoctorSlotsSubscription } from '../../hooks/useDoctorSlotsSubscription';

const PRIORITY_OPTIONS: Array<{ value: TicketPriority; label: string }> = [
  { value: 'Low', label: 'Низкий' },
  { value: 'Medium', label: 'Средний' },
  { value: 'High', label: 'Высокий' },
];

const { TextArea } = Input;

type FormValues = CreateTicketRequest & {
  appointmentDate?: Dayjs;
};

const TIME_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

export default function NewTicketPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [serverError, setServerError] = useState<string | null>(null);

  const specialty = Form.useWatch('doctorSpecialty', form);
  const doctorId = Form.useWatch('doctorId', form);
  const appointmentDate = Form.useWatch('appointmentDate', form);

  const categoriesQuery = useQuery({
    queryKey: ['new-ticket-categories'],
    queryFn: () => getCategories(false),
  });

  const specialtiesQuery = useQuery({
    queryKey: ['doctor-specialties'],
    queryFn: getDoctorSpecialties,
  });

  const doctorsQuery = useQuery({
    queryKey: ['doctors', specialty],
    queryFn: () => getDoctors({ specialty }),
    enabled: Boolean(specialty),
  });

  const slotsQuery = useQuery({
    queryKey: ['doctor-slots', doctorId],
    queryFn: () => getDoctorSlots(Number(doctorId)),
    enabled: Boolean(doctorId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Подписываемся на обновления слотов врача в реальном времени
  useDoctorSlotsSubscription({
    doctorId: doctorId ? Number(doctorId) : null,
    onSlotsUpdated: () => {
      void slotsQuery.refetch();
    },
    enabled: Boolean(doctorId),
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['patient-tickets'] });
      messageApi.success('Запись успешно создана');
      navigate(`/tickets/${ticket.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setServerError(error.detail ?? error.message);
        return;
      }

      setServerError('Не удалось создать запись');
    },
  });

  const filteredCategories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter(
        (category) => !specialty || category.doctorSpecialty === specialty,
      ),
    [categoriesQuery.data, specialty],
  );

  const slotsByDate = useMemo(() => buildSlotsByDate(slotsQuery.data ?? []), [slotsQuery.data]);
  const availableDateKeys = useMemo(() => Array.from(slotsByDate.keys()).sort(), [slotsByDate]);
  const selectedDateKey = appointmentDate ? appointmentDate.format('YYYY-MM-DD') : undefined;
  const timeOptions = selectedDateKey
    ? (slotsByDate.get(selectedDateKey) ?? []).map((slot) => ({
        value: slot.id,
        label: TIME_FORMATTER.format(new Date(slot.startAt)),
      }))
    : [];

  const handleFinish = (values: FormValues) => {
    setServerError(null);
    createMutation.mutate({
      description: values.description.trim(),
      doctorSpecialty: values.doctorSpecialty,
      categoryId: values.categoryId,
      doctorId: values.doctorId,
      doctorTimeSlotId: values.doctorTimeSlotId,
      priority: values.priority,
    });
  };

  if (categoriesQuery.isLoading || specialtiesQuery.isLoading) {
    return <PageLoading />;
  }

  if (categoriesQuery.isError || specialtiesQuery.isError) {
    return <PageError message="Не удалось загрузить данные для записи" />;
  }

  const getDisabledDateReason = (current: Dayjs) => {
    if (!doctorId) {
      return 'Сначала выберите врача.';
    }

    if (!availableDateKeys.includes(current.format('YYYY-MM-DD'))) {
      return 'На эту дату у врача нет свободных слотов.';
    }

    return null;
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}

      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Новая запись
        </Typography.Title>
        <Typography.Text type="secondary">
          Выберите специальность, услугу, врача и удобное время приема.
        </Typography.Text>
      </div>

      {serverError ? (
        <Alert type="error" message={serverError} closable onClose={() => setServerError(null)} />
      ) : null}

      <Form<FormValues>
        form={form}
        layout="vertical"
        style={{ maxWidth: 720 }}
        onFinish={handleFinish}
        disabled={createMutation.isPending}
        initialValues={{ priority: 'Medium' }}
      >
        <Form.Item
          name="doctorSpecialty"
          label="Специальность врача"
          rules={[{ required: true, message: 'Выберите специальность врача' }]}
        >
          <Select
            placeholder="Выберите специальность"
            options={(specialtiesQuery.data ?? []).map((item) => ({ label: item, value: item }))}
            onChange={() => {
              form.setFieldsValue({
                categoryId: undefined,
                doctorId: undefined,
                appointmentDate: undefined,
                doctorTimeSlotId: undefined,
              });
            }}
          />
        </Form.Item>

        <Form.Item
          name="categoryId"
          label="Услуга"
          rules={[{ required: true, message: 'Выберите услугу' }]}
        >
          <Select
            placeholder="Выберите услугу"
            options={filteredCategories.map((category) => ({
              label: `${category.name} (${category.price} ₽)`,
              value: category.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="doctorId"
          label="ФИО врача"
          rules={[{ required: true, message: 'Выберите врача' }]}
        >
          <Select
            placeholder="Выберите врача"
            loading={doctorsQuery.isLoading}
            options={(doctorsQuery.data ?? []).map((doctor) => ({
              label: doctor.fullName,
              value: doctor.id,
            }))}
            onChange={() => {
              form.setFieldsValue({ appointmentDate: undefined, doctorTimeSlotId: undefined });
              void slotsQuery.refetch();
            }}
          />
        </Form.Item>

        <Form.Item
          name="appointmentDate"
          label="Дата приема"
          rules={[{ required: true, message: 'Выберите дату приема' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD.MM.YYYY"
            placeholder="Выберите дату в календаре"
            disabled={!doctorId}
            disabledDate={(current) => {
              if (!current) {
                return false;
              }

              return getDisabledDateReason(current) !== null;
            }}
            cellRender={(current, info) => {
              if (info.type !== 'date') {
                return info.originNode;
              }

              const currentDate = dayjs(current);
              const reason = getDisabledDateReason(currentDate);
              if (!reason) {
                // Дата со свободными слотами - выделяем зеленым фоном
                return (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#f6ffed',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #b7eb8f',
                    }}
                  >
                    {info.originNode}
                  </div>
                );
              }

              // Дата без свободных слотов - серый цвет
              return (
                <Tooltip title={reason}>
                  <div style={{ opacity: 0.45 }}>{info.originNode}</div>
                </Tooltip>
              );
            }}
            onChange={() => {
              form.setFieldValue('doctorTimeSlotId', undefined);
            }}
            onOpenChange={(open) => {
              if (open && doctorId) {
                void slotsQuery.refetch();
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="doctorTimeSlotId"
          label="Время приема"
          rules={[{ required: true, message: 'Выберите время приема' }]}
        >
          <Select placeholder="Выберите время" disabled={!selectedDateKey} options={timeOptions} />
        </Form.Item>

        <Form.Item
          name="description"
          label="Жалоба"
          rules={[
            { required: true, message: 'Введите жалобу' },
            { max: 2000, message: 'Максимум 2000 символов' },
          ]}
        >
          <TextArea
            rows={6}
            maxLength={2000}
            showCount
            placeholder="Опишите жалобы и причину записи"
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Приоритет"
          rules={[{ required: true, message: 'Выберите приоритет' }]}
        >
          <Select placeholder="Выберите приоритет" options={PRIORITY_OPTIONS} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Записаться
            </Button>
            <Button onClick={() => navigate('/patient/tickets')}>Отмена</Button>
          </Space>
        </Form.Item>
      </Form>
    </Space>
  );
}

function buildSlotsByDate(slots: DoctorTimeSlot[]) {
  const map = new Map<string, DoctorTimeSlot[]>();

  slots.forEach((slot) => {
    const dateKey = dayjs(slot.startAt).format('YYYY-MM-DD');
    const current = map.get(dateKey) ?? [];
    current.push(slot);
    map.set(dateKey, current);
  });

  return map;
}
