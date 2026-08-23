import { Table, Badge, Button, Avatar, Modal, Select, Input } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useState } from 'react'
import {
	diagnosisTitleStyle,
	fullWidthStyle,
	infoTitleStyle,
	modalBodyStyle,
	modalHeaderButtonsStyle,
	modalHeaderRowStyle,
	modalPatientRowStyle,
	modalTitleStyle,
	patientAgeStyle,
	patientCellRowStyle,
	patientModalNameStyle,
	patientNameStyle,
	recommendationsTitleStyle,
	titleStyle,
} from './DoctorPatients.styles'

type PatientRecord = {
	key: string
	dateTime: string
	name: string
	age: number
	diagnosis: string
	selectedDiagnosis?: string
	recommendations?: string
	birthDate: string
	email: string
	phone: string
	address: string
}

export default function DoctorPatients() {
	const [open, setOpen] = useState(false)
	const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
	const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | undefined>()
	const [recommendations, setRecommendations] = useState('')

	const columns = [
		{
			title: 'Дата и время',
			dataIndex: 'dateTime',
			key: 'dateTime',
		},
		{
			title: 'Предстоящий приём',
			dataIndex: 'patient',
			key: 'patient',
			render: (_: unknown, record: PatientRecord) => (
				<div style={patientCellRowStyle}>
					<Avatar icon={<UserOutlined />} size={32} />
					<div>
						<div style={patientNameStyle}>{record.name}</div>
						<div style={patientAgeStyle}>{record.age} лет</div>
					</div>
				</div>
			),
		},
		{
			title: 'Диагноз',
			dataIndex: 'diagnosis',
			key: 'diagnosis',
		},
		{
			title: 'Статус',
			dataIndex: 'status',
			key: 'status',
			render: () => <Badge color='blue' text='Запланирован' />,
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (_: unknown, record: PatientRecord) => (
				<Button
					onClick={() => {
						setSelectedPatient(record)
						setSelectedDiagnosis(record.selectedDiagnosis)
						setRecommendations(record.recommendations ?? '')
						setOpen(true)
					}}
				>
					Карта
				</Button>
			),
		},
	]

	const data: PatientRecord[] = [
		{
			key: '1',
			dateTime: '24 февраля 10:00',
			name: 'Иванов Иван Иванович',
			age: 40,
			diagnosis: 'Боль в горле, температура 37.8',
			selectedDiagnosis: 'РђРЅРіРёРЅР°',
			recommendations: 'РџРѕР»РѕСЃРєР°РЅРёРµ РіРѕСЂР»Р°, РѕР±РёР»СЊРЅРѕРµ РїРёС‚СЊРµ, РєРѕРЅС‚СЂРѕР»СЊ С‚РµРјРїРµСЂР°С‚СѓСЂС‹.',
			birthDate: '15.03.1985',
			email: 'ivanov@mail.ru',
			phone: '+7 (916) 123-45-67',
			address: 'г. Москва, ул. Ленина, 12-34',
		},
		{
			key: '2',
			dateTime: '24 февраля 11:00',
			name: 'Соколова Ольга Николаевна',
			age: 33,
			diagnosis: 'Кашель, насморк 5 дней',
			selectedDiagnosis: 'РћР Р’Р',
			recommendations: 'РЎРёРјРїС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ Р»РµС‡РµРЅРёРµ, РѕС‚РґС‹С… Рё РЅР°Р±Р»СЋРґРµРЅРёРµ 3 РґРЅСЏ.',
			birthDate: '12.08.1992',
			email: 'sokolova@mail.ru',
			phone: '+7 (916) 987-65-43',
			address: 'г. Москва, ул. Тверская, 5',
		},
		{
			key: '3',
			dateTime: '24 февраля 14:30',
			name: 'Семёнов Николай Петрович',
			age: 60,
			diagnosis: 'Давление 160/100, отеки ног',
			selectedDiagnosis: 'Р‘СЂРѕРЅС…РёС‚',
			recommendations: 'РџРѕРІС‚РѕСЂРЅС‹Р№ РєРѕРЅС‚СЂРѕР»СЊ РґР°РІР»РµРЅРёСЏ Рё РєРѕСЂСЂРµРєС†РёСЏ С‚РµСЂР°РїРёРё.',
			birthDate: '22.01.1965',
			email: 'semenov@mail.ru',
			phone: '+7 (916) 555-11-22',
			address: 'г. Москва, ул. Пушкина, 10',
		},
	]

	return (
		<div>
			<h1 style={titleStyle}>Пациенты на приём</h1>

			<Table columns={columns} dataSource={data} pagination={false} />

			<Modal
				open={open}
				onCancel={() => setOpen(false)}
				footer={null}
				width={680}
				bodyStyle={modalBodyStyle}
			>
				<div style={modalHeaderRowStyle}>
					<h3 style={modalTitleStyle}>Электронная карта пациента</h3>

					<div style={modalHeaderButtonsStyle}>
						<Button type='primary' onClick={() => setOpen(false)}>
							Завершить приём
						</Button>
						<Button onClick={() => setOpen(false)}>Закрыть</Button>
					</div>
				</div>

				<div style={modalPatientRowStyle}>
					<Avatar icon={<UserOutlined />} size={40} />
					<div style={patientModalNameStyle}>{selectedPatient?.name}</div>
				</div>

				<h2 style={infoTitleStyle}>Основная информация</h2>

				<Table
					//dataIndex: 'label' → берёт record.label
					// dataIndex: 'value' → берёт record.value
					columns={[
						{ dataIndex: 'label', width: '50%', align: 'center' },
						{ dataIndex: 'value', width: '50%', align: 'center' },
					]}
					dataSource={[
						{
							key: '1',
							label: 'Дата рождения',
							value: selectedPatient?.birthDate,
						},
						{ key: '2', label: 'Email', value: selectedPatient?.email },
						{ key: '3', label: 'Телефон', value: selectedPatient?.phone },
						{ key: '4', label: 'Адрес', value: selectedPatient?.address },
					]}
					pagination={false}
					showHeader={false}
				/>

				<h3 style={diagnosisTitleStyle}>Диагноз</h3>

				<Select
					value={selectedDiagnosis}
					onChange={setSelectedDiagnosis}
					placeholder={selectedPatient?.diagnosis}
					options={[
						{ value: 'ОРВИ', label: 'ОРВИ' },
						{ value: 'Грипп', label: 'Грипп' },
						{ value: 'Ангина', label: 'Ангина' },
						{ value: 'Бронхит', label: 'Бронхит' },
						{ value: 'Пневмония', label: 'Пневмония' },
					]}
					style={fullWidthStyle}
				/>

				<h3 style={recommendationsTitleStyle}>Рекомендации</h3>

				<Input.TextArea
					rows={4}
					value={recommendations}
					onChange={(event) => setRecommendations(event.target.value)}
				/>
			</Modal>
		</div>
	)
}
