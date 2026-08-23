import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../shared/api/http/client';
import PageError from '../components/PageError';
import PageValidation from '../components/PageValidation';
import { useAuth, type Role } from '../contexts/AuthContext';

interface FormValues {
  email: string;
  password: string;
}

type LoginFieldName = keyof FormValues;

const ROLE_REDIRECTS: Record<Role, string> = {
  Patient: '/patient/main',
  Doctor: '/doctor/main',
  Admin: '/admin/main',
};

export default function LoginPage() {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'MedClinic - Вход';

    if (isAuthenticated && role) {
      navigate(ROLE_REDIRECTS[role], { replace: true });
    }
  }, [isAuthenticated, navigate, role]);

  const handleSubmit = async (values: FormValues) => {
    setValidationErrors([]);
    setPageError(null);
    setAlertError(null);
    form.setFields([
      { name: 'email', errors: [] },
      { name: 'password', errors: [] },
    ]);

    setLoading(true);

    try {
      await login(values.email, values.password);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const fieldErrors = err.fieldErrors ?? {};

          form.setFields(
            Object.entries(fieldErrors).map(([name, errors]) => ({
              name: (name.charAt(0).toLowerCase() + name.slice(1)) as LoginFieldName,
              errors,
            })),
          );

          setValidationErrors(err.validationMessages.length ? err.validationMessages : [err.message]);
        } else if (err.status >= 500) {
          setPageError(err.detail ?? err.title ?? 'Ошибка сервера. Попробуйте позже.');
        } else {
          setAlertError(err.detail ?? err.title ?? err.message);
        }
      } else {
        setPageError('Ошибка сети. Проверьте подключение и попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>
          MedClinic
        </Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Войдите в аккаунт
        </Typography.Text>

        {validationErrors.length > 0 && <PageValidation errors={validationErrors} />}
        {pageError && <PageError message={pageError} />}

        {alertError && (
          <Alert
            type="error"
            message={alertError}
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setAlertError(null)}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input placeholder="you@example.com" autoComplete="email" />
          </Form.Item>

          <Form.Item label="Пароль" name="password" rules={[{ required: true, message: 'Введите пароль' }]}>
            <Input.Password placeholder="Пароль" autoComplete="current-password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Войти
            </Button>
          </Form.Item>
        </Form>

        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </Typography.Text>
      </Card>
    </div>
  );
}
