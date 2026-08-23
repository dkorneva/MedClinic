import { useState } from 'react'
import {
	Steps,
	Button,
	Select,
	Card,
	Avatar,
	Calendar,
	Alert,
	Table,
	Tag,
	Rate,
	Modal,
	Result,
} from 'antd'
import { UserOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import {
	alertStyle,
	calendarColumnStyle,
	calendarStyle,
	confirmationLabelStyle,
	confirmationTableWrapperStyle,
	confirmationValueStyle,
	doctorAvatarStyle,
	doctorCardHeaderStyle,
	doctorCardStyle,
	doctorMetaStyle,
	doctorNameStyle,
	doctorPriceStyle,
	doctorRatingRowStyle,
	fieldLabelStyle,
	footerButtonsStyle,
	formColumnStyle,
	pageStyle,
	pageTitleStyle,
	selectStyle,
	selectedTimeButtonStyle,
	specialtyLabelStyle,
	stepContentWrapperStyle,
	stepOneContentStyle,
	stepZeroContentStyle,
	stepsStyle,
	strongFieldLabelStyle,
	timeSlotsStyle,
} from './PatientAppointment.styles'

// деструктуризация для удобства использования компонентов Select
const { Option } = Select

const steps = [
	{ title: 'Специалист' },
	{ title: 'Дата и время' },
	{ title: 'Подтверждение' },
]

export default function PatientAppointment() {
	const [currentStep, setCurrentStep] = useState(0)
	const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>(
		undefined
	)
	const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(
		undefined,
	)
	const [selectedDate, setSelectedDate] = useState<Dayjs | undefined>(undefined)
	const [selectedTime, setSelectedTime] = useState<string>('')
	const [isModalVisible, setIsModalVisible] = useState(false)

	const next = () => {
		if (currentStep === 2) {
			setIsModalVisible(true)
		} else {
			setCurrentStep(currentStep + 1)
		}
	}

	const prev = () => {
		setCurrentStep(currentStep - 1)
	}

	const specialtyOptions = [{ value: 'Терапевт', label: 'Терапевт' }]
	const doctorOptions = [
		{
			value: 'Петров Александр Иванович',
			label: 'Петров Александр Иванович',
		},
	]

	const timeSlots = ['9:00', '9:30', '10:00', '11:00', '12:00', '12:30', '13:30']

	const confirmationData = [
		{ key: 1, label: 'Специализация', value: 'Терапевт' },
		{ key: 2, label: 'Врач', value: 'Петров Александр Иванович' },
		{
			key: 3,
			label: 'Дата',
			value: selectedDate ? selectedDate.format('DD MMMM YYYY') : '',
		},
		{ key: 4, label: 'Время', value: selectedTime },
	]

	const columns = [
		{
			dataIndex: 'label',
			key: 'label',
			render: (text: string) => <span style={confirmationLabelStyle}>{text}</span>,
		},
		{
			dataIndex: 'value',
			key: 'value',
			render: (text: string) => <span style={confirmationValueStyle}>{text}</span>,
		},
	]

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div style={stepZeroContentStyle}>
						<div style={formColumnStyle}>
							<div>
								<div style={specialtyLabelStyle}>Специалист</div>
								<Select
									placeholder='Выберите специальность'
									style={selectStyle}
									onChange={setSelectedSpecialty}
									value={selectedSpecialty}
								>
									{specialtyOptions.map(option => (
										<Option key={option.value} value={option.value}>
											{option.label}
										</Option>
									))}
								</Select>
							</div>
							<div>
								<div style={fieldLabelStyle}>Врач</div>
								<Select
									placeholder='Выберите врача'
									style={selectStyle}
									onChange={setSelectedDoctor}
									value={selectedDoctor}
								>
									{doctorOptions.map(option => (
										<Option key={option.value} value={option.value}>
											{option.label}
										</Option>
									))}
								</Select>
							</div>
						</div>
						{selectedDoctor && ( // если selectedDoctor не пустой, код внутри скобок будет отрендерен
							<Card style={doctorCardStyle}>
								<div style={doctorCardHeaderStyle}>
									<Avatar
										icon={<UserOutlined />}
										size={40}
										style={doctorAvatarStyle}
									/>
									<div>
										<div style={doctorNameStyle}>Петров Александр Иванович</div>
										<Tag color='blue'>Терапевт</Tag>
										<div style={doctorPriceStyle}>1200 ₽</div>
									</div>
								</div>
								<div style={doctorMetaStyle}>
									<div style={doctorRatingRowStyle}>
										Рейтинг:{' '}
										<Rate
											disabled
											defaultValue={4.5}
											/*disabled — булевый проп (если написан без =, значит true, allowHalf тоже)*/ allowHalf
										/>
									</div>
									<div>
										Рабочие дни: <Tag>Пн</Tag> <Tag>Вт</Tag> <Tag>Чт</Tag>{' '}
										<Tag>Пт</Tag>
									</div>
								</div>
							</Card>
						)}
					</div>
				)
			case 1:
				return (
					<div style={stepOneContentStyle}>
						<div style={calendarColumnStyle}>
							<div style={strongFieldLabelStyle}>Выберите дату:</div>
							<Calendar
								fullscreen={false}
								onSelect={setSelectedDate}
								value={selectedDate}
								style={calendarStyle}
							/>
						</div>
						<div>
							{selectedDate && ( // если selectedDate не пустой, код внутри скобок будет отрендерен
								<>
									<div style={strongFieldLabelStyle}>Выберите время:</div>
									<div style={timeSlotsStyle}>
										{timeSlots.map(time => (
											<Button
												key={time}
												type='dashed'
												onClick={() => setSelectedTime(time)}
												style={
													selectedTime === time
														? selectedTimeButtonStyle
														: undefined
												}
											>
												{time}
											</Button>
										))}
									</div>
								</>
							)}
						</div>
					</div>
				)
			case 2:
				return (
					<div>
						<Alert
							message='Подтверждение записи'
							description='Убедитесь, что все данные верны'
							type='info'
							showIcon
							style={alertStyle}
						/>
						<div style={confirmationTableWrapperStyle}>
							<Table
								dataSource={confirmationData}
								columns={columns}
								pagination={false}
								showHeader={false}
							/>
						</div>
					</div>
				)
			default:
				return null
		}
	}

	return (
		<>
			<div style={pageStyle}>
				<h1 style={pageTitleStyle}>Запись на приём</h1>
				<Steps current={currentStep} items={steps} style={stepsStyle} />
				<div style={stepContentWrapperStyle}>{renderStepContent()}</div>
				<div style={footerButtonsStyle}>
					<Button disabled={currentStep === 0} onClick={prev}>
						Назад
					</Button>
					<Button
						type='primary'
						onClick={next}
						disabled={
							(currentStep === 0 && !selectedDoctor) ||
							(currentStep === 1 && !selectedTime)
						}
					>
						Далее
					</Button>
				</div>
			</div>
			<Modal
				title={null}
				open={isModalVisible}
				onOk={() => setIsModalVisible(false)}
				onCancel={() => setIsModalVisible(false)}
				footer={null}
			>
				<Result
					status='success'
					title='Вы успешно записались на приём'
					subTitle='Все записи можно просмотреть в профиле'
				/>
			</Modal>
		</>
	)
}
