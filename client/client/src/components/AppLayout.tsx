import { Button, Layout, Menu, Space, Typography, theme } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

const patientMenuItems = [
  { key: '/patient/main', label: <Link to="/patient/main">Главная</Link> },
  { key: '/patient/tickets', label: <Link to="/patient/tickets">Мои записи</Link> },
  { key: '/patient/tickets/new', label: <Link to="/patient/tickets/new">Новая запись</Link> },
];

const doctorMenuItems = [
  { key: '/doctor/main', label: <Link to="/doctor/main">Главная</Link> },
  { key: '/doctor/schedule', label: <Link to="/doctor/schedule">Расписание</Link> },
  { key: '/doctor/queue/new', label: <Link to="/doctor/queue/new">Новые записи</Link> },
  { key: '/doctor/queue/assigned', label: <Link to="/doctor/queue/assigned">Текущие приёмы</Link> },
  { key: '/doctor/queue/resolved', label: <Link to="/doctor/queue/resolved">Завершённые приёмы</Link> },
];

const adminMenuItems = [
  { key: '/admin/main', label: <Link to="/admin/main">Главная</Link> },
  { key: '/admin/schedule', label: <Link to="/admin/schedule">Расписание</Link> },
  { key: '/admin/reports', label: <Link to="/admin/reports">Отчёты</Link> },
  { key: '/admin/categories', label: <Link to="/admin/categories">Услуги</Link> },
  { key: '/admin/users', label: <Link to="/admin/users">Пользователи</Link> },
];

function resolveSelectedKey(pathname: string, role: string | null) {
  if (pathname.startsWith('/tickets/')) {
    return role === 'Doctor' ? '/doctor/queue/resolved' : '/patient/tickets';
  }

  return pathname;
}

export default function AppLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // деструктуризация
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems =
    role === 'Patient'
      ? patientMenuItems
      : role === 'Doctor'
        ? doctorMenuItems
        : role === 'Admin'
          ? adminMenuItems
          : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <Typography.Title level={4} style={{ color: 'white', margin: 0 }}>
          MedClinic
        </Typography.Title>
        <Space>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
            {user?.displayName ?? 'Гость'} · {role}
          </Typography.Text>
          <Button type="link" style={{ color: 'white', padding: 0 }} onClick={handleLogout}>
            Выйти
          </Button>
        </Space>
      </Header>

      <Layout>
        <Sider width={240} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            selectedKeys={[resolveSelectedKey(location.pathname, role)]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>

        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: colorBgContainer,
              borderRadius: 8,
              padding: 24,
              minHeight: 360,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
