import { useQuery } from '@tanstack/react-query';
import { Avatar, Progress, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { ApiError } from '../../shared/api/http/client';
import {
  getAdminDashboard,
  type AdminDashboardAppointment,
  type AdminDoctorLoad,
} from '../../entities/admin';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import {
  appointmentMetaClampStyle,
  appointmentNameStyle,
  appointmentRowStyle,
  appointmentTimeStyle,
  doctorNameStyle,
  doctorSpecStyle,
  doctorsRowStyle,
  headerStyle,
  rowTextColStyle,
  subtitleStyle,
  tableColumnStyle,
  tablesRowStyle,
  titleStyle,
} from './AdminMain.styles';

export default function AdminMain() {
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  });

  if (dashboardQuery.isLoading) {
    return <PageLoading />;
  }

  if (dashboardQuery.isError) {
    return (
      <PageError
        message={
          dashboardQuery.error instanceof ApiError ? dashboardQuery.error.message : undefined
        }
      />
    );
  }

  const data = dashboardQuery.data;
  if (!data) {
    return <PageEmpty description="Данные панели администратора пока недоступны" />;
  }

  const appointmentsColumns: TableColumnsType<AdminDashboardAppointment> = [
    {
      title: 'Приёмы сегодня',
      dataIndex: 'appointment',
      key: 'appointment',
      render: (_, record) => (
        <div style={appointmentRowStyle}>
          <Avatar size={40}>{getInitials(record.patientName)}</Avatar>
          <div style={rowTextColStyle}>
            <div style={appointmentNameStyle}>{record.patientName}</div>
            <div
              style={appointmentMetaClampStyle}
            >{`${record.doctorName} / ${record.doctorSpecialty}`}</div>
            <div style={appointmentTimeStyle}>{dayjs(record.appointmentAt).format('HH:mm')}</div>
          </div>
        </div>
      ),
    },
  ];

  const doctorsColumns: TableColumnsType<AdminDoctorLoad> = [
    {
      title: 'Врачи на смене',
      dataIndex: 'doctor',
      key: 'doctor',
      render: (_, record) => (
        <div style={doctorsRowStyle}>
          <Avatar size={40}>{getInitials(record.doctorName)}</Avatar>
          <div style={rowTextColStyle}>
            <div style={doctorNameStyle}>{record.doctorName}</div>
            <div style={doctorSpecStyle}>{record.specialty}</div>
            <Progress percent={Number(record.loadPercent)} size="small" style={{ width: '100%' }} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={headerStyle}>
        <div style={titleStyle}>Панель администратора</div>
        <div style={subtitleStyle}>{dayjs().format('D MMMM YYYY')}</div>
      </div>

      <div style={tablesRowStyle}>
        <div style={tableColumnStyle}>
          {data.todayAppointments.length > 0 && (
            <Table
              rowKey="ticketId"
              columns={appointmentsColumns}
              dataSource={data.todayAppointments}
              pagination={false}
              bordered={false}
            />
          )}
        </div>

        <div style={tableColumnStyle}>
          {data.doctorLoads.length === 0 ? (
            <PageEmpty description="Активные врачи со слотами не найдены" />
          ) : (
            <Table
              rowKey="doctorId"
              columns={doctorsColumns}
              dataSource={data.doctorLoads}
              pagination={false}
              bordered={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
