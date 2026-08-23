import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Calendar,
  Card,
  DatePicker,
  Empty,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { ApiError } from '../../shared/api/http/client';
import {
  getDoctorSchedule,
  getDoctors,
  updateDoctorSchedule,
  type Doctor,
  type DoctorScheduleSlot,
} from '../../entities/doctor';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import { useDoctorSlotsSubscription } from '../../hooks/useDoctorSlotsSubscription';

type ScheduleRow = DoctorScheduleSlot & {
  key: string;
  source: 'db' | 'draft';
};

export default function AdminSchedule() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>();
  const [selectedDateKey, setSelectedDateKey] = useState(dayjs().format('YYYY-MM-DD'));
  const [slotDraft, setSlotDraft] = useState<Dayjs | null>(null);
  const [draftSlots, setDraftSlots] = useState<string[]>([]);

  const doctorsQuery = useQuery({
    queryKey: ['admin-schedule-doctors'],
    queryFn: () => getDoctors(),
  });

  useEffect(() => {
    if (!selectedDoctorId && doctorsQuery.data?.length) {
      setSelectedDoctorId(doctorsQuery.data[0].id);
    }
  }, [doctorsQuery.data, selectedDoctorId]);

  const scheduleQuery = useQuery({
    queryKey: ['admin-doctor-schedule', selectedDoctorId],
    queryFn: () => getDoctorSchedule(selectedDoctorId!),
    enabled: Boolean(selectedDoctorId),
  });

  useEffect(() => {
    if (!scheduleQuery.data) {
      return;
    }

    const editableSlots = scheduleQuery.data
      .filter((slot) => isEditableSlot(slot.startAt))
      .map((slot) => slot.startAt);

    setDraftSlots(editableSlots);

    const firstDate = editableSlots[0]
      ? dayjs(editableSlots[0]).format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD');
    setSelectedDateKey(firstDate);
  }, [scheduleQuery.data, selectedDoctorId]);

  const saveMutation = useMutation({
    mutationFn: ({ doctorId, slots }: { doctorId: number; slots: string[] }) =>
      updateDoctorSchedule(doctorId, slots),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['admin-doctor-schedule', variables.doctorId],
      });
      await queryClient.invalidateQueries({ queryKey: ['doctor-slots', variables.doctorId] });
      void messageApi.success('Расписание врача обновлено.');
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        void messageApi.error(error.detail ?? error.message);
        return;
      }

      void messageApi.error('Не удалось обновить расписание.');
    },
  });

  // Подписываемся на обновления слотов врача в реальном времени
  useDoctorSlotsSubscription({
    doctorId: selectedDoctorId ?? null,
    onSlotsUpdated: () => {
      void scheduleQuery.refetch();
    },
    enabled: Boolean(selectedDoctorId),
  });

  if (doctorsQuery.isLoading || (selectedDoctorId && scheduleQuery.isLoading)) {
    return <PageLoading />;
  }

  if (doctorsQuery.isError || scheduleQuery.isError) {
    const error = doctorsQuery.error ?? scheduleQuery.error;
    return <PageError message={error instanceof ApiError ? error.message : undefined} />;
  }

  const doctors = doctorsQuery.data ?? [];
  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId);
  const baseSchedule = (scheduleQuery.data ?? []).filter((slot) => isEditableSlot(slot.startAt));
  const baseScheduleMap = new Map(baseSchedule.map((slot) => [slot.startAt, slot]));

  const mergedSchedule: ScheduleRow[] = [...draftSlots]
    .sort((left, right) => dayjs(left).valueOf() - dayjs(right).valueOf())
    .map((slotStartAt) => {
      const existingSlot = baseScheduleMap.get(slotStartAt);

      if (existingSlot) {
        return { ...existingSlot, key: `db-${existingSlot.id}`, source: 'db' as const };
      }

      return {
        id: 0,
        startAt: slotStartAt,
        isBooked: false,
        ticketId: null,
        patientName: null,
        categoryName: null,
        status: null,
        key: `draft-${slotStartAt}`,
        source: 'draft' as const,
      };
    });

  const selectedDayRows = mergedSchedule.filter(
    (slot) => dayjs(slot.startAt).format('YYYY-MM-DD') === selectedDateKey,
  );
  const hasChanges =
    draftSlots.length !== baseSchedule.length ||
    draftSlots.some((slot) => !baseScheduleMap.has(slot));

  const bookedCount = mergedSchedule.filter((slot) => slot.isBooked).length;
  const loadPercent =
    mergedSchedule.length === 0 ? 0 : Math.round((bookedCount / mergedSchedule.length) * 100);

  const columns: TableColumnsType<ScheduleRow> = [
    {
      title: 'Время',
      dataIndex: 'startAt',
      key: 'startAt',
      width: 140,
      render: (value: string) => dayjs(value).format('HH:mm'),
    },
    {
      title: 'Статус',
      key: 'status',
      width: 160,
      render: (_, record) => renderSlotStatus(record),
    },
    {
      title: 'Пациент / услуга',
      key: 'details',
      render: (_, record) =>
        record.isBooked ? (
          <div>
            <div>{record.patientName}</div>
            <Typography.Text type="secondary">{record.categoryName}</Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">Свободный слот</Typography.Text>
        ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 180,
      render: (_, record) =>
        record.isBooked ? (
          <Typography.Text type="secondary">Занятый слот</Typography.Text>
        ) : (
          <Popconfirm
            title="Удалить слот?"
            okText="Удалить"
            cancelText="Отмена"
            onConfirm={() => removeSlot(record.startAt, setDraftSlots)}
          >
            <Button danger>Удалить</Button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}

      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Расписание врачей
        </Typography.Title>
      </div>

      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Space wrap>
              <Select
                style={{ width: 360 }}
                placeholder="Выберите врача"
                value={selectedDoctorId}
                options={doctors.map((doctor: Doctor) => ({
                  value: doctor.id,
                  label: `${doctor.fullName} · ${doctor.specialty}`,
                }))}
                onChange={(value) => setSelectedDoctorId(value)}
              />

              <DatePicker
                showTime={{ format: 'HH:mm', minuteStep: 30 }}
                format="DD.MM.YYYY HH:mm"
                placeholder="Новый слот"
                value={slotDraft}
                onChange={setSlotDraft}
                disabledDate={disablePastDates}
                disabledTime={(date) => disableSlotTime(date, draftSlots)}
                disabled={!selectedDoctor}
              />

              <Button
                type="primary"
                disabled={!selectedDoctor || !slotDraft}
                onClick={() =>
                  addSlot(slotDraft, draftSlots, setDraftSlots, setSlotDraft, messageApi)
                }
              >
                Добавить слот
              </Button>
            </Space>

            <Button
              type="primary"
              disabled={!selectedDoctorId || !hasChanges}
              loading={saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({ doctorId: selectedDoctorId!, slots: draftSlots })
              }
            >
              Сохранить расписание
            </Button>
          </div>

          {selectedDoctor ? (
            <Space wrap>
              <Tag>{selectedDoctor.fullName}</Tag>
              <Tag color="blue">{selectedDoctor.specialty}</Tag>
              <Tag
                color={
                  selectedDoctor.status === 'Active'
                    ? 'green'
                    : selectedDoctor.status === 'Vacation'
                      ? 'orange'
                      : 'default'
                }
              >
                {getDoctorStatusLabel(selectedDoctor.status)}
              </Tag>
              <Tag>Всего слотов: {mergedSchedule.length}</Tag>
              <Tag>Занято: {bookedCount}</Tag>
            </Space>
          ) : null}

          <Progress percent={loadPercent} format={() => `Загрузка ${loadPercent}%`} />

          {hasChanges ? <Tag color="gold">Есть несохраненные изменения</Tag> : null}
        </Space>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 16 }}>
        <Card title="Календарь">
          <Calendar
            fullscreen={false}
            value={dayjs(selectedDateKey)}
            onSelect={(value) => setSelectedDateKey(value.format('YYYY-MM-DD'))}
          />
        </Card>

        <Card title={`Слоты на ${dayjs(selectedDateKey).format('DD.MM.YYYY')}`}>
          {selectedDoctorId ? (
            selectedDayRows.length === 0 ? (
              <Empty description="На выбранную дату слотов нет" />
            ) : (
              <Table
                rowKey="key"
                columns={columns}
                dataSource={selectedDayRows}
                pagination={false}
              />
            )
          ) : (
            <Empty description="Сначала выберите врача" />
          )}
        </Card>
      </div>
    </Space>
  );
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

function addSlot(
  slotDraft: Dayjs | null,
  draftSlots: string[],
  setDraftSlots: React.Dispatch<React.SetStateAction<string[]>>,
  setSlotDraft: React.Dispatch<React.SetStateAction<Dayjs | null>>,
  messageApi: ReturnType<typeof message.useMessage>[0],
) {
  if (!slotDraft) {
    return;
  }

  // Отправляем время как локальное время в формате ISO (без корректировки в UTC)
  const nextSlot = slotDraft.second(0).millisecond(0).format('YYYY-MM-DDTHH:mm:ss');
  if (!isEditableSlot(nextSlot)) {
    void messageApi.warning('Нельзя добавить слот в прошлом.');
    return;
  }

  if (draftSlots.includes(nextSlot)) {
    void messageApi.warning('Такой слот уже есть в расписании.');
    return;
  }

  setDraftSlots((current) => [...current, nextSlot]);
  setSlotDraft(null);
}

function removeSlot(
  slotStartAt: string,
  setDraftSlots: React.Dispatch<React.SetStateAction<string[]>>,
) {
  setDraftSlots((current) => current.filter((slot) => slot !== slotStartAt));
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

function renderSlotStatus(slot: ScheduleRow) {
  if (!slot.isBooked) {
    return <Tag color="default">Свободен</Tag>;
  }

  switch (slot.status) {
    case 'Resolved':
      return <Tag color="green">Завершён</Tag>;
    case 'InProgress':
      return <Tag color="processing">В работе</Tag>;
    case 'Rejected':
      return <Tag color="red">Отклонён</Tag>;
    default:
      return <Tag color="gold">Новая запись</Tag>;
  }
}

function getDoctorStatusLabel(status: Doctor['status']) {
  switch (status) {
    case 'Active':
      return 'Активен';
    case 'Vacation':
      return 'В отпуске';
    default:
      return 'Неактивен';
  }
}
