import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { ApiError } from '../../shared/api/http/client';
import { createCategory, getCategories, setCategoryActive, updateCategory, type Category } from '../../entities/category';
import { getDoctorSpecialties } from '../../entities/doctor';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';

const categoriesKey = ['admin-categories'] as const;

type CategoryFormValues = {
  name: string;
  doctorSpecialty: string;
  price: number;
};

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm<CategoryFormValues>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: categoriesKey,
    queryFn: () => getCategories(true),
  });

  const specialtiesQuery = useQuery({
    queryKey: ['admin-category-specialties'],
    queryFn: getDoctorSpecialties,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey });
      messageApi.success('Услуга создана');
      setModalOpen(false);
      form.resetFields();
    },
    onError: showMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & CategoryFormValues) => updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey });
      messageApi.success('Услуга обновлена');
      setModalOpen(false);
      form.resetFields();
      setEditingCategory(null);
    },
    onError: showMutationError,
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setCategoryActive(id, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoriesKey });
      messageApi.success(variables.isActive ? 'Услуга активирована' : 'Услуга скрыта');
    },
    onError: showMutationError,
  });

  function showMutationError(error: unknown) {
    if (error instanceof ApiError) {
      messageApi.error(error.detail ?? error.title ?? error.message);
      return;
    }

    messageApi.error('Не удалось выполнить операцию');
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const specialtyOptions = useMemo(
    () => (specialtiesQuery.data ?? []).map((item) => ({ label: item, value: item })),
    [specialtiesQuery.data],
  );

  const openCreateModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      doctorSpecialty: category.doctorSpecialty,
      price: category.price,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }

    setModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const submitModal = async () => {
    const values = await form.validateFields();
    const payload: CategoryFormValues = {
      name: values.name.trim(),
      doctorSpecialty: values.doctorSpecialty,
      price: Number(values.price),
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, ...payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const columns: TableColumnsType<Category> = [
    {
      title: 'Название услуги',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Специальность врача',
      dataIndex: 'doctorSpecialty',
      key: 'doctorSpecialty',
    },
    {
      title: 'Стоимость',
      dataIndex: 'price',
      key: 'price',
      width: 160,
      render: (price: number) => currencyFormatter.format(price),
    },
    {
      title: 'Статус',
      key: 'isActive',
      width: 160,
      render: (_, record) => (record.isActive ? <Tag color="green">Активна</Tag> : <Tag color="default">Скрыта</Tag>),
    },
    {
      title: 'Видимость',
      key: 'visibility',
      width: 140,
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          disabled={activeMutation.isPending}
          onChange={(isActive) => activeMutation.mutate({ id: record.id, isActive })}
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 160,
      render: (_, record) => <Button onClick={() => openEditModal(record)}>Редактировать</Button>,
    },
  ];

  if (isLoading || specialtiesQuery.isLoading) {
    return <PageLoading />;
  }

  if (isError || specialtiesQuery.isError) {
    return <PageError message={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" size={4}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Услуги клиники
            </Typography.Title>
            <Typography.Text type="secondary">
              Управляйте услугами клиники.
            </Typography.Text>
          </Space>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Список услуг
            </Typography.Title>
            <Button type="primary" onClick={openCreateModal}>
              Добавить услугу
            </Button>
          </div>

          {!data || data.length === 0 ? (
            <PageEmpty description="Услуги пока не добавлены" />
          ) : (
            <Table<Category> rowKey="id" columns={columns} dataSource={data} pagination={false} />
          )}
        </Card>
      </Space>

      <Modal
        title={editingCategory ? 'Редактирование услуги' : 'Новая услуга'}
        open={modalOpen}
        onOk={submitModal}
        onCancel={closeModal}
        okText={editingCategory ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        okButtonProps={{ loading: isSubmitting }}
        cancelButtonProps={{ disabled: isSubmitting }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Название услуги"
            name="name"
            rules={[
              { required: true, message: 'Введите название услуги' },
              { max: 100, message: 'Максимум 100 символов' },
            ]}
          >
            <Input maxLength={100} placeholder="Например, первичный прием терапевта" />
          </Form.Item>

          <Form.Item
            label="Специальность врача"
            name="doctorSpecialty"
            rules={[{ required: true, message: 'Выберите специальность врача' }]}
          >
            <Select placeholder="Выберите специальность" options={specialtyOptions} />
          </Form.Item>

          <Form.Item
            label="Стоимость услуги"
            name="price"
            rules={[{ required: true, message: 'Укажите стоимость услуги' }]}
          >
            <InputNumber<number>
              min={0.01}
              precision={2}
              step={100}
              style={{ width: '100%' }}
              placeholder="Например, 2500"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
