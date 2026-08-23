import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { ApiError } from '../../shared/api/http/client';
import { getUsers, updateUserRole, type UserResponse, type UserRole } from '../../entities/user';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';

const usersKey = ['admin-users'] as const;
const roles: UserRole[] = ['Patient', 'Doctor', 'Admin'];

const roleLabels: Record<UserRole, string> = {
  Patient: 'Пациент',
  Doctor: 'Врач',
  Admin: 'Администратор',
};

const roleTagColors: Record<UserRole, string> = {
  Patient: 'blue',
  Doctor: 'green',
  Admin: 'gold',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole>>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: usersKey,
    queryFn: getUsers,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateUserRole(id, { role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKey });
      messageApi.success('Роль пользователя обновлена');
      setDraftRoles((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        messageApi.error(error.detail ?? error.title ?? error.message);
        return;
      }

      messageApi.error('Не удалось обновить роль');
    },
  });

  const columns: TableColumnsType<UserResponse> = [
    {
      title: 'Пользователь',
      key: 'displayName',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.displayName}</Typography.Text>
          <Typography.Text type="secondary">{record.email}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Текущая роль',
      dataIndex: 'role',
      key: 'role',
      width: 180,
      render: (role: UserRole) => <Tag color={roleTagColors[role]}>{roleLabels[role]}</Tag>,
    },
    {
      title: 'Сменить роль',
      key: 'changeRole',
      width: 320,
      render: (_, record) => {
        const selectedRole = draftRoles[record.id] ?? record.role;
        const isPendingRow = updateRoleMutation.isPending && updateRoleMutation.variables?.id === record.id;

        return (
          <Space>
            <Select<UserRole>
              value={selectedRole}
              style={{ width: 160 }}
              disabled={isPendingRow}
              options={roles.map((role) => ({ value: role, label: roleLabels[role] }))}
              onChange={(role) => setDraftRoles((current) => ({ ...current, [record.id]: role }))}
            />
            <Button
              type="primary"
              loading={isPendingRow}
              disabled={isPendingRow || selectedRole === record.role}
              onClick={() => updateRoleMutation.mutate({ id: record.id, role: selectedRole })}
            >
              Сохранить
            </Button>
          </Space>
        );
      },
    },
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  if (isError) {
    return <PageError message={error instanceof ApiError ? error.message : undefined} />;
  }

  if (!data || data.length === 0) {
    return <PageEmpty description="Пользователи не найдены" />;
  }

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" size={4}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Пользователи клиники
            </Typography.Title>
            <Typography.Text type="secondary">
              Управляйте ролями пациентов, врачей и администраторов. Новая роль начнет действовать после следующего входа.
            </Typography.Text>
          </Space>
        </Card>

        <Card>
          <Table<UserResponse> rowKey="id" columns={columns} dataSource={data} pagination={false} />
        </Card>
      </Space>
    </>
  );
}
