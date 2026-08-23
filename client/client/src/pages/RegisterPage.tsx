import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../shared/api/http/client';
import PageError from '../components/PageError';
import PageValidation from '../components/PageValidation';
import { useAuth, type Role } from '../contexts/AuthContext';

interface FormValues {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type RegisterFieldName = keyof FormValues; 

const ROLE_REDIRECTS: Record<Role, string> = { 
  Patient: '/patient/main',
  Doctor: '/doctor/main',
  Admin: '/admin/main',
};

export default function RegisterPage() {
  const { register, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'MedClinic - Регистрация';

    if (isAuthenticated && role) {
      navigate(ROLE_REDIRECTS[role], { replace: true });
    }
  }, [isAuthenticated, navigate, role]);

  const handleSubmit = async (values: FormValues) => {
    setValidationErrors([]);
    setPageError(null);
    setAlertError(null);
    form.setFields([
      { name: 'displayName', errors: [] },
      { name: 'email', errors: [] },
      { name: 'password', errors: [] },
      { name: 'confirmPassword', errors: [] },
    ]);

    setLoading(true);

    try {
      await register(values.displayName, values.email, values.password, 'Patient');
    } catch (err) {
      if (err instanceof ApiError) { 
        if (err.status === 400) { 
          const fieldErrors = err.fieldErrors ?? {}; 

          form.setFields(
            Object.entries(fieldErrors).map(([name, errors]) => ({
              name: (name.charAt(0).toLowerCase() + name.slice(1)) as RegisterFieldName,
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
        <Typography.Text
          type="secondary"
          style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}
        >
          Создайте новый аккаунт
        </Typography.Text>

        {validationErrors.length > 0 && <PageValidation errors={validationErrors} />} {}
        {pageError && <PageError message={pageError} />} {}

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
            label="Имя"
            name="displayName"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input placeholder="Иван Иванов" autoComplete="name" />
          </Form.Item>

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

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Пароль должен содержать минимум 6 символов' },
            ]}
          >
            <Input.Password placeholder="Пароль" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            label="Подтверждение пароля"
            name="confirmPassword"
            dependencies={['password']} // dependencies указывает, что это поле зависит от поля 'password', и при изменении 'password' будет выполняться валидация этого поля
            rules={[
              { required: true, message: 'Подтвердите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
									if (!value || getFieldValue('password') === value) {
										return Promise.resolve()
									}

									return Promise.reject(new Error('Пароли не совпадают'))
								},
              }),
            ]}
          >
            <Input.Password placeholder="Повторите пароль" autoComplete="new-password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>

        <Typography.Text
          type="secondary"
          style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}
        >
          Регистрация создаёт учётную запись пациента в текущей конфигурации приложения.
        </Typography.Text>

        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </Typography.Text>
      </Card>
    </div>
  );
}
