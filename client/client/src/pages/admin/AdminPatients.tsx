import { Avatar, Button, DatePicker, Form, Input, Modal, Popconfirm, Table } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import {
	actionButtonStyle,
	actionsRowStyle,
	formItemNoMarginStyle,
	fullWidthLeftTextStyle,
	headerRowStyle,
	inputLeftTextStyle,
	modalBodyScrollStyle,
	modalFieldLabelStyle,
	modalFooterStyle,
	modalFormStyle,
	modalTitleStyle,
	nameCellRowStyle,
	nameCellTextColStyle,
	patientEmailStyle,
	patientModalStyles,
	patientNameStyle,
	rootStyle,
	searchInputStyle,
	searchRowStyle,
	subtitleStyle,
	tableStyle,
	tableWrapperStyle,
	titleStyle,
} from './AdminPatients.styles'


// интерфейс можно расширять и дополнять после объявления, а type нет
// type может использовать объединения и пересечения, а интерфейс - нет
// type может быть любым типом, interface - только объектный тип или тип функции 
interface PatientRecord {
	key: string
	name: string
	email: string
	dob: string
	phone: string
	address: string
	avatar: string
}

type PatientFormValues = {
	fullName?: string
	dob?: Dayjs | null
	phone?: string
	email?: string
	address?: string
}

const toDayjsFromDDMMYYYY = (value: string): Dayjs | null => {
	const parts = value.split('.')
	const day = Number(parts[0]) 
	const month = Number(parts[1])
	const year = Number(parts[2])
	if (!day || !month || !year) return null
	return dayjs(new Date(year, month - 1, day))
}

const patientsData: PatientRecord[] = [
	{
		key: '1',
		name: 'Иванов Иван Иванович',
		email: 'ivanov@mail.ru',
		dob: '15.03.1985',
		phone: '+7 (916) 123-45-67',
		address: 'г. Москва, ул. Пушкина, д. 10',
		avatar: 'ИИ',
	},
	{
		key: '2',
		name: 'Соколова Ольга Николаевна',
		email: 'sokolova@mail.ru',
		dob: '22.07.1992',
		phone: '+7 (926) 234-56-78',
		address: 'г. Москва, ул. Пушкина, д. 10',
		avatar: 'СО',
	},
	{
		key: '3',
		name: 'Попов Владимир Андреевич',
		email: 'popov@mail.ru',
		dob: '08.11.1978',
		phone: '+7 (903) 345-67-89',
		address: 'г. Москва, ул. Пушкина, д. 10',
		avatar: 'ПВ',
	},
	{
		key: '4',
		name: 'Лебедева Татьяна Сергеевна',
		email: 'lebedeva@mail.ru',
		dob: '14.05.2001',
		phone: '+7 (963) 456-78-90',
		address: 'г. Москва, ул. Пушкина, д. 10',
		avatar: 'ЛТ',
	},
]

const totalPatients = patientsData.length

export default function AdminPatients() {
	const [searchValue, setSearchValue] = useState('')
	const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
	const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
	const [addForm] = Form.useForm<PatientFormValues>()
	const [editForm] = Form.useForm<PatientFormValues>()


	const filteredPatients = useMemo(() => {
		const normalized = searchValue.trim().toLowerCase()
		if (!normalized) {
			return patientsData
		}

		return patientsData.filter(patient =>
			`${patient.name} ${patient.email}`.toLowerCase().includes(normalized),
		)
	}, [searchValue])

	const paginationConfig = useMemo<TablePaginationConfig>(
		() => ({
			pageSize: Math.max(filteredPatients.length, 1),
			total: filteredPatients.length,
			showSizeChanger: false,
			hideOnSinglePage: false,
			position: ['bottomRight'],
		}),
		[filteredPatients.length],
	)

	const closeAddPatient = () => setIsAddPatientOpen(false)
	const openAddPatient = () => {
		addForm.resetFields()
		setIsAddPatientOpen(true)
	}

	const closeEditPatient = () => setIsEditPatientOpen(false)

	const openEditPatient = (record: PatientRecord) => {
		editForm.setFieldsValue({
			fullName: record.name,
			dob: toDayjsFromDDMMYYYY(record.dob),
			phone: record.phone,
			email: record.email,
			address: record.address,
		})
		setIsEditPatientOpen(true)
	}

	const columns: ColumnsType<PatientRecord> = [
		{
			title: 'ФИО',
			dataIndex: 'name',
			key: 'name',
			render: (_, record) => (
				<div style={nameCellRowStyle}>
					<Avatar size={40}>{record.avatar}</Avatar>
					<div style={nameCellTextColStyle}>
						<div style={patientNameStyle}>{record.name}</div>
						<div style={patientEmailStyle}>{record.email}</div>
					</div>
				</div>
			),
		},
		{
			title: 'Дата рождения',
			dataIndex: 'dob',
			key: 'dob',
		},
		{
			title: 'Телефон',
			dataIndex: 'phone',
			key: 'phone',
		},
		{
			title: 'Адрес',
			dataIndex: 'address',
			key: 'address',
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (_, record) => (
				<div style={actionsRowStyle}>
					<Button
						type='default'
						style={actionButtonStyle}
						onClick={() => openEditPatient(record)}
					>
						Изменить
					</Button>
					<Popconfirm
						title='Вы уверены, что хотите удалить запись?'
						okText='Да'
						cancelText='Нет'
						onConfirm={() => {}}
						onCancel={() => {}}
					>
						<Button type='primary' danger style={actionButtonStyle}>
							Удалить
						</Button>
					</Popconfirm>
				</div>
			),
		},
	]

	return (
		<div style={rootStyle}>
			<div style={headerRowStyle}>
				<h1 style={titleStyle}>Пациенты</h1>
				<Button type='primary' onClick={openAddPatient}>
					+ Добавить пациента
				</Button>
			</div>
			<p style={subtitleStyle}>
				База данных пациентов клиники — всего {totalPatients} записей
			</p>
			<div style={searchRowStyle}>
				<Input.Search
					placeholder='Введите ФИО пациента'
					value={searchValue}
					onChange={event => setSearchValue(event.target.value)}
					onSearch={value => setSearchValue(value)}
					allowClear
					style={searchInputStyle}
				/>
			</div>
			<div style={tableWrapperStyle}>
				<Table
					columns={columns}
					dataSource={filteredPatients}
					pagination={paginationConfig}
					rowKey='key' // rowKey='key' указывает, какое поле объекта использовать как уникальный идентификатор строки
					scroll={{ x: 'max-content' }}
					style={tableStyle}
				/>
			</div>
			<Modal
				open={isAddPatientOpen}
				onCancel={closeAddPatient}
				footer={null}
				width={560}
				centered
				title={<div style={modalTitleStyle}>Добавить пациента</div>}
				styles={patientModalStyles}
			>
				<Form form={addForm} layout='vertical' style={modalFormStyle}>
					<div style={modalBodyScrollStyle}>
						<div style={modalFieldLabelStyle}>ФИО</div>
						<Form.Item style={formItemNoMarginStyle}>
							<Input
								placeholder='Иванов Иван Иванович'
								style={inputLeftTextStyle}
							/>
						</Form.Item>

						<div style={modalFieldLabelStyle}>Дата рождения</div>
						<Form.Item style={formItemNoMarginStyle}>
							<DatePicker
								placeholder='ДД.ММ.ГГГГ'
								format='DD.MM.YYYY'
								style={fullWidthLeftTextStyle}
							/>
						</Form.Item>

						<div style={modalFieldLabelStyle}>Телефон</div>
						<Form.Item style={formItemNoMarginStyle}>
							<Input
								placeholder='+7 (XXX) XXX-XX-XX'
								style={inputLeftTextStyle}
							/>
						</Form.Item>

						<div style={modalFieldLabelStyle}>Email</div>
						<Form.Item style={formItemNoMarginStyle}>
							<Input
								placeholder='example@example.com'
								style={inputLeftTextStyle}
							/>
						</Form.Item>

						<div style={modalFieldLabelStyle}>Адрес</div>
						<Form.Item style={formItemNoMarginStyle}>
							<Input
								placeholder='г. Москва, ул. ...'
								style={inputLeftTextStyle}
							/>
						</Form.Item>
					</div>

					<div style={modalFooterStyle}>
						<Button type='default' onClick={closeAddPatient}>
							Назад
						</Button>
						<Button type='primary' onClick={closeAddPatient}>
							Добавить
						</Button>
					</div>
				</Form>
			</Modal>

			<Modal
				open={isEditPatientOpen}
				onCancel={closeEditPatient}
				footer={null}
				width={560}
				centered
				title={<div style={modalTitleStyle}>Изменить пациента</div>}
				styles={patientModalStyles}
			>
				<Form form={editForm} layout='vertical' style={modalFormStyle}>
					<div style={modalBodyScrollStyle}>
						<div style={modalFieldLabelStyle}>ФИО</div>
						<Form.Item name='fullName' style={formItemNoMarginStyle}>
							<Input
								placeholder='Иванов Иван Иванович'
								style={inputLeftTextStyle}
							/>
						</Form.Item>

						<div style={modalFieldLabelStyle}>Дата рождения</div>
						<Form.Item name='dob' style={formItemNoMarginStyle}>
							<DatePicker
								placeholder='ДД.ММ.ГГГГ'
								format='DD.MM.YYYY'
								style={fullWidthLeftTextStyle}
							/>
						</Form.Item>

						<div style={modalFieldLabelStyle}>Телефон</div>
						<Form.Item name='phone' style={formItemNoMarginStyle}>
							<Input
								placeholder='+7 (XXX) XXX-XX-XX'
								style={inputLeftTextStyle}
							/>
						</Form.Item>

						<div style={modalFieldLabelStyle}>Email</div>
						<Form.Item name='email' style={formItemNoMarginStyle}>
							<Input
								placeholder='example@example.com'
								style={inputLeftTextStyle}
							/>
						</Form.Item>

						<div style={modalFieldLabelStyle}>Адрес</div>
						<Form.Item name='address' style={formItemNoMarginStyle}>
							<Input
								placeholder='г. Москва, ул. ...'
								style={inputLeftTextStyle}
							/>
						</Form.Item>
					</div>

					<div style={modalFooterStyle}>
						<Button type='default' onClick={closeEditPatient}>
							Назад
						</Button>
						<Button type='primary' onClick={closeEditPatient}>
							Изменить
						</Button>
					</div>
				</Form>
			</Modal>
		</div>
	)
}
