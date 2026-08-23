import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { ApiError } from '../../shared/api/http/client';
import {
  createDoctor,
  deleteDoctor,
  getDoctors,
  getDoctorSlots,
  type Doctor,
  type DoctorPayload,
  type DoctorStatus,
  updateDoctor,
} from '../../entities/doctor';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';

type DoctorFormValues = {
  fullName: string;
  email: string;
  specialty: string;
  status: DoctorStatus;
};

const DOCTOR_STATUS_OPTIONS: Array<{ label: string; value: DoctorStatus }> = [
  { label: 'Активен', value: 'Active' },
  { label: 'В отпуске', value: 'Vacation' },
  { label: 'Неактивен', value: 'Inactive' },
];

const STATUS_COLORS: Record<DoctorStatus, string> = {
  Active: 'green',
  Vacation: 'orange',
  Inactive: 'default',
};

const STATUS_LABELS: Record<DoctorStatus, string> = {
  Active: 'Активен',
  Vacation: 'В отпуске',
  Inactive: 'Неактивен',
};

export default function AdminDoctors() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [slotDraft, setSlotDraft] = useState<Dayjs | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [form] = Form.useForm<DoctorFormValues>();

  const doctorsQuery = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => getDoctors({ includeInactive: true }),
  });

  const doctorSlotsQuery = useQuery({
    queryKey: ['admin-doctor-slots', editingDoctor?.id], // ? (Optional Chaining) — защищает от null/undefined, возвращая undefined
    queryFn: () => getDoctorSlots(editingDoctor!.id), // ! (Non-null Assertion) — говорит компилятору, что значение не будет null/undefined
    enabled: modalOpen && editingDoctor !== null,
  });

  const createMutation = useMutation({
    mutationFn: createDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-specialties'] });
      messageApi.success('Врач добавлен');
      closeModal(true);
    },
    onError: showMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DoctorPayload }) =>
      updateDoctor(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-specialties'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-slots', variables.id] });
      messageApi.success('Врач обновлен');
      closeModal(true);
    },
    onError: showMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-specialties'] });
      messageApi.success('Врач удален');
    },
    onError: showMutationError,
  });

  function showMutationError(error: unknown) {
    if (error instanceof ApiError) {
      messageApi.error(error.detail ?? error.title ?? error.message);
      return;
    }

    if (error instanceof Error) {
      messageApi.error(error.message);
      return;
    }

    messageApi.error('Не удалось выполнить операцию');
  }

  useEffect(() => {
    if (!doctorSlotsQuery.data) {
      return;
    }

    setSlots(
      doctorSlotsQuery.data
        .filter((slot) => isEditableSlot(slot.startAt))
        .map((slot) => slot.startAt)
        .sort((left, right) => dayjs(left).valueOf() - dayjs(right).valueOf()),
    );
  }, [doctorSlotsQuery.data]);

  const doctors = doctorsQuery.data ?? [];
  const filteredDoctors = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) {
      return doctors;
    }

    return doctors.filter((doctor) =>
      `${doctor.fullName} ${doctor.email} ${doctor.specialty}`.toLowerCase().includes(normalized),
    );
  }, [doctors, searchValue]);

  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter((doctor) => doctor.status === 'Active').length;
  const vacationDoctors = doctors.filter((doctor) => doctor.status === 'Vacation').length;
  const inactiveDoctors = doctors.filter((doctor) => doctor.status === 'Inactive').length;
  const sortedSlots = [...slots].sort(
    (left, right) => dayjs(left).valueOf() - dayjs(right).valueOf(),
  );

  const columns: ColumnsType<Doctor> = [
    {
      title: 'Врач',
      key: 'fullName',
      render: (_, record) => (
        <div>
          <div>{record.fullName}</div>
          <Typography.Text type="secondary">{record.email}</Typography.Text>
        </div>
      ),
    },
    {
      title: 'Специальность',
      dataIndex: 'specialty',
      key: 'specialty',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: DoctorStatus) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => openEditModal(record)}>Редактировать</Button>
          <Popconfirm
            title="Удалить врача?"
            description="Удаление недоступно, если по врачу уже есть записи."
            okText="Удалить"
            cancelText="Отмена"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button danger loading={deleteMutation.isPending}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const openCreateModal = () => {
    setEditingDoctor(null);
    form.resetFields();
    form.setFieldValue('status', 'Active');
    setSlotDraft(null);
    setSlots([]);
    setModalOpen(true);
  };

  const openEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    form.setFieldsValue({
      fullName: doctor.fullName,
      email: doctor.email,
      specialty: doctor.specialty,
      status: doctor.status,
    });
    setSlotDraft(null);
    setSlots([]);
    setModalOpen(true);
  };

  const closeModal = (reset = false) => {
    setModalOpen(false);
    setEditingDoctor(null);
    setSlotDraft(null);
    setSlots([]);
    if (reset) {
      form.resetFields();
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (slots.length === 0) {
        throw new Error('Добавьте хотя бы один слот приема.');
      }

      const payload: DoctorPayload = {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        specialty: values.specialty.trim(),
        status: values.status,
        slots: sortedSlots,
      };

      if (editingDoctor) {
        updateMutation.mutate({ id: editingDoctor.id, payload });
        return;
      }

      createMutation.mutate(payload);
    } catch (error) {
      showMutationError(error);
    }
  };

  if (doctorsQuery.isLoading) {
    return <PageLoading />;
  }

  if (doctorsQuery.isError) {
    return <PageError message="Не удалось загрузить врачей" />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}

      <Card>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                Врачи клиники
              </Typography.Title>
              <Typography.Text type="secondary">
                Справочник врачей хранится в БД и используется в услугах и записи пациента.
              </Typography.Text>
            </div>
            <Button type="primary" onClick={openCreateModal}>
              Добавить врача
            </Button>
          </div>

          <Space wrap>
            <Tag>Всего: {totalDoctors}</Tag>
            <Tag color="green">Активных: {activeDoctors}</Tag>
            <Tag color="orange">В отпуске: {vacationDoctors}</Tag>
            <Tag>Неактивных: {inactiveDoctors}</Tag>
          </Space>
        </Space>
      </Card>

      <Card>
        <Input.Search
          placeholder="Поиск по ФИО, email или специальности"
          allowClear
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          style={{ marginBottom: 16, maxWidth: 420 }}
        />

        {filteredDoctors.length === 0 ? (
          <PageEmpty description="Врачи пока не найдены" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredDoctors}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title={editingDoctor ? 'Редактирование врача' : 'Новый врач'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => closeModal(false)}
        okText={editingDoctor ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        okButtonProps={{ loading: createMutation.isPending || updateMutation.isPending }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="fullName"
            label="ФИО"
            rules={[{ required: true, message: 'Введите ФИО врача' }]}
          >
            <Input placeholder="Иванов Иван Иванович" />
          </Form.Item>

          <Form.Item
            name="specialty"
            label="Специальность"
            rules={[{ required: true, message: 'Введите специальность' }]}
          >
            <Input placeholder="Терапевт" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input placeholder="doctor@medclinic.ru" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Статус"
            rules={[{ required: true, message: 'Выберите статус' }]}
          >
            <Select options={DOCTOR_STATUS_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="Слоты приема"
            extra="Выберите дату и время в календаре, затем добавьте слот кнопкой."
          >
            <Space.Compact style={{ width: '100%' }}>
              <DatePicker
                style={{ width: '100%' }}
                showTime={{ format: 'HH:mm', minuteStep: 30 }}
                format="DD.MM.YYYY HH:mm"
                value={slotDraft}
                onChange={setSlotDraft}
                disabledDate={disablePastDates}
                disabledTime={(date) => disableSlotTime(date, slots)}
                placeholder="Выберите дату и время"
              />
              <Button
                type="primary"
                onClick={() => addSlot(slotDraft, slots, setSlots, setSlotDraft)}
              >
                Добавить
              </Button>
            </Space.Compact>
          </Form.Item>

          {editingDoctor && doctorSlotsQuery.isLoading ? (
            <Typography.Text type="secondary">Загружаю текущие слоты врача...</Typography.Text>
          ) : null}

          <Space wrap size={[8, 8]}>
            {sortedSlots.map((slot) => (
              <Tag
                key={slot}
                closable
                onClose={(event) => {
                  event.preventDefault();
                  removeSlot(slot, setSlots);
                }}
              >
                {formatSlot(slot)}
              </Tag>
            ))}
          </Space>

          {sortedSlots.length === 0 ? (
            <Typography.Text type="secondary">Слоты пока не добавлены.</Typography.Text>
          ) : null}
        </Form>
      </Modal>
    </Space>
  );
}

function addSlot(
  slotDraft: Dayjs | null,
  slots: string[],
  setSlots: React.Dispatch<React.SetStateAction<string[]>>,
  setSlotDraft: React.Dispatch<React.SetStateAction<Dayjs | null>>,
) {
  if (!slotDraft) {
    return;
  }

  // Отправляем время как локальное время в формате ISO (без корректировки в UTC)
  const nextSlot = slotDraft.second(0).millisecond(0).format('YYYY-MM-DDTHH:mm:ss');
  if (!isEditableSlot(nextSlot)) {
    return;
  }

  if (slots.includes(nextSlot)) {
    return;
  }

  setSlots((current) => [...current, nextSlot]);
  setSlotDraft(null);
}

// React.SetStateAction<T>	Тип, который может быть либо значением T, либо функцией, возвращающей T
function removeSlot(slot: string, setSlots: React.Dispatch<React.SetStateAction<string[]>>) {
  setSlots((current) => current.filter((item) => item !== slot));
}

function formatSlot(slot: string) {
  return dayjs(slot).format('DD.MM.YYYY HH:mm');
}

function isEditableSlot(slotStartAt: string) {
  return dayjs(slotStartAt).isAfter(dayjs());
}

function disablePastDates(current: Dayjs) {
  return current.isBefore(dayjs().startOf('day'));
}

function disablePastTime(date: Dayjs | null) {
  if (!date || !date.isSame(dayjs(), 'day')) {
    return {};
  }

  const now = dayjs();
  const currentHour = now.hour();
  const currentMinute = now.minute();

  return {
    disabledHours: () => Array.from({ length: currentHour }, (_, hour) => hour),
    disabledMinutes: (selectedHour: number) => {
      if (selectedHour !== currentHour) {
        return [];
      }

      return Array.from({ length: currentMinute }, (_, minute) => minute);
    },
  };
}

function disableSlotTime(date: Dayjs | null, slots: string[]) {
  const pastTimeConfig = disablePastTime(date);

  if (!date) {
    return pastTimeConfig;
  }

  const takenTimeMap = getTakenTimeMap(slots, date);

  return {
    disabledHours: () => pastTimeConfig.disabledHours?.() ?? [],
    disabledMinutes: (selectedHour: number) => {
      const disabledPastMinutes = pastTimeConfig.disabledMinutes?.(selectedHour) ?? [];
      const disabledTakenMinutes = Array.from(takenTimeMap.get(selectedHour) ?? []).sort((a, b) => a - b);

      return Array.from(new Set([...disabledPastMinutes, ...disabledTakenMinutes])).sort((a, b) => a - b);
    },
  };
}

function getTakenTimeMap(slots: string[], selectedDate: Dayjs) {
  const takenTimeMap = new Map<number, Set<number>>();

  slots.forEach((slot) => {
    const slotDate = dayjs(slot);
    if (!slotDate.isSame(selectedDate, 'day')) {
      return;
    }

    const hour = slotDate.hour();
    const minute = slotDate.minute();
    const takenMinutes = takenTimeMap.get(hour) ?? new Set<number>();
    takenMinutes.add(minute);
    takenTimeMap.set(hour, takenMinutes);
  });

  return takenTimeMap;
}
