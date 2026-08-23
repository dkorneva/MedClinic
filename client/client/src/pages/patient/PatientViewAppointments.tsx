import { useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  appointmentCellRowStyle,
  dateStyle,
  diagnosisStyle,
  headerRowStyle,
  headerTitleStyle,
  nameStyle,
  noteStyle,
  pageStyle,
  selectStyle,
  specialtyTextStyle,
  statusBadgeStyle,
  statusDotStyle,
  statusTextStyle,
} from './PatientViewAppointments.styles';

type AppointmentStatus = 'Новый' | 'Завершён' | 'Отменён';
type AppointmentAction = 'buttons' | 'completed' | 'cancelled';
type ModalAction = 'reschedule' | null;

interface AppointmentRecord {
  key: string;
  date: string;
  name: string;
  specialty: string;
  diagnosis: string;
  status: AppointmentStatus;
  actions: AppointmentAction;
}

const specialtyOptions = [
  { label: 'Терапевт', value: 'Терапевт' },
  { label: 'Невролог', value: 'Невролог' },
  { label: 'Офтальмолог', value: 'Офтальмолог' },
];

const statusOptions = [
  { label: 'Новый', value: 'Новый' },
  { label: 'Завершён', value: 'Завершён' },
  { label: 'Отменён', value: 'Отменён' },
];

const data: AppointmentRecord[] = [
  {
    key: '1',
    date: '24 февраля 11:00',
    name: 'Петров Александр Иванович',
    specialty: 'Терапевт',
    diagnosis: 'Не установлен',
    status: 'Новый',
    actions: 'buttons',
  },
  {
    key: '2',
    date: '27 февраля 14:30',
    name: 'Новикова Анна Михайловна',
    specialty: 'Невролог',
    diagnosis: 'Не установлен',
    status: 'Новый',
    actions: 'buttons',
  },
  {
    key: '3',
    date: '21 января 10:00',
    name: 'Петров Александр Иванович',
    specialty: 'Терапевт',
    diagnosis: 'ОРВИ',
    status: 'Завершён',
    actions: 'completed',
  },
  {
    key: '4',
    date: '19 января 13:00',
    name: 'Козлова Ирина Владимировна',
    specialty: 'Офтальмолог',
    diagnosis: 'Миопия',
    status: 'Завершён',
    actions: 'completed',
  },
  {
    key: '5',
    date: '15 января 9:30',
    name: 'Новикова Анна Михайловна',
    specialty: 'Невролог',
    diagnosis: 'Бессонница',
    status: 'Завершён',
    actions: 'completed',
  },
  {
    key: '6',
    date: '16 января 15:00',
    name: 'Петров Александр Иванович',
    specialty: 'Терапевт',
    diagnosis: 'Не установлен',
    status: 'Отменён',
    actions: 'cancelled',
  },
];

export default function PatientViewAppointments() {
  const [specialty, setSpecialty] = useState<string | undefined>();
  const [status, setStatus] = useState<AppointmentStatus | undefined>();
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [rescheduleForm] = Form.useForm();

  const openModal = (action: Exclude<ModalAction, null>, _appointment: AppointmentRecord) => {
    // Exclude убирает null из типа ModalAction, так как при открытии модала он не может быть null, а должен быть конкретным действием, например 'reschedule'
    //_appointment можно использовать для передачи данных о конкретной записи (в будущем)
    setModalAction(action);
  };

  const closeModal = () => {
    rescheduleForm.resetFields();
    setModalAction(null);
  };

  const filteredData = useMemo(
    () =>
      data.filter((record) => {
        const matchesSpecialty = specialty ? record.specialty === specialty : true; // если specialty не выбрана (undefined), то считаем, что все записи подходят, иначе фильтруем по выбранной специальности, аналогично для статуса
        const matchesStatus = status ? record.status === status : true;
        return matchesSpecialty && matchesStatus; // возвращаем только те записи, которые соответствуют выбранным фильтрам. Если фильтр не выбран, то он не влияет на результат.
      }),
    [specialty, status],
  );

  const columns: ColumnsType<AppointmentRecord> = [
    // типизация для колонок таблицы, указываем, что каждая колонка соответствует структуре AppointmentRecord
    {
      title: 'Дата и время',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => <span style={dateStyle}>{text}</span>,
    },
    {
      title: 'Предстоящий приём',
      dataIndex: 'appointment',
      key: 'appointment',
      width: 260,
      render: (_value, record) => (
        <div style={appointmentCellRowStyle}>
          <Avatar icon={<UserOutlined />} size={32} />
          <div>
            <p style={nameStyle}>{record.name}</p>
            <p style={specialtyTextStyle}>{record.specialty}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Диагноз',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      render: (text: string) => <span style={diagnosisStyle}>{text}</span>,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (text: AppointmentStatus) => {
        let statusColor = '#1677ff';
        if (text === 'Завершён') statusColor = '#52c41a';
        if (text === 'Отменён') statusColor = '#ff4d4f';
        const statusLabel = <span style={statusTextStyle}>{text}</span>;
        return (
          <span style={statusBadgeStyle}>
            <span style={{ ...statusDotStyle, backgroundColor: statusColor }} />
            {statusLabel}
          </span>
        );
      },
    },
    {
      title: 'Действия',
      dataIndex: 'actions',
      key: 'actions',
      render: (_value, record) => {
        if (record.actions === 'buttons') {
          return (
            <Space>
              <Button type="default" onClick={() => openModal('reschedule', record)}>
                Перенести
              </Button>
              <Popconfirm
                title="Вы уверены, что хотите отменить запись"
                okText="Да"
                cancelText="Нет"
                onConfirm={() => undefined}
              >
                <Button type="primary" danger>
                  Отменить
                </Button>
              </Popconfirm>
            </Space>
          );
        }
        if (record.actions === 'completed') {
          return <Tag color="cyan">Завершён</Tag>;
        }
        if (record.actions === 'cancelled') {
          return <Tag color="red">Отменён</Tag>;
        }
        return null;
      },
    },
  ];

  return (
    <>
      <div style={pageStyle}>
        <div style={headerRowStyle}>
          <h2 style={headerTitleStyle}>Мои записи</h2>
          <Space>
            <Select
              allowClear
              placeholder="Выберите специальность"
              style={selectStyle}
              value={specialty}
              options={specialtyOptions}
              onChange={setSpecialty}
            />
            <Select
              allowClear
              placeholder="Выберите статус"
              style={selectStyle}
              value={status}
              options={statusOptions}
              onChange={(value) => setStatus(value as AppointmentStatus | undefined)}
            />
          </Space>
        </div>
        <p style={noteStyle}>Управление записями на приём к врачам</p>
        <Table columns={columns} dataSource={filteredData} pagination={false} />
      </div>

      <Modal
        open={modalAction === 'reschedule'}
        onCancel={closeModal}
        footer={null}
        width={560}
        centered
        destroyOnHidden
        modalRender={(node) => (
          <div
            style={{
              minHeight: 380,
              borderRadius: 10,
              background: '#FFF',
              boxShadow:
                '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
            }}
          >
            {node}
          </div>
        )}
        title={
          <span
            style={{
              color: 'rgba(0, 0, 0, 0.88)',
              fontFamily: '"Segoe UI"',
              fontSize: 16,
              fontStyle: 'normal',
              fontWeight: 600,
              lineHeight: '24px',
            }}
          >
            Перенос записи
          </span>
        }
        styles={{
          body: {
            paddingTop: 8,
            paddingBottom: 24,
          },
        }}
      >
        <Form form={rescheduleForm} layout="vertical">
          <Form.Item
            label={
              <span
                style={{
                  color: 'rgba(0, 0, 0, 0.88)',
                  fontFamily: '"Segoe UI"',
                  fontSize: 14,
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: '22px',
                }}
              >
                Укажите причину переноса
              </span>
            }
            name="reason"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label={
              <span
                style={{
                  color: 'rgba(0, 0, 0, 0.88)',
                  fontFamily: '"Segoe UI"',
                  fontSize: 14,
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: '22px',
                }}
              >
                Дата нового приёма
              </span>
            }
            name="newDate"
          >
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={closeModal}>Назад</Button>
            <Button type="primary" onClick={closeModal}>
              Перенести
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
