import type { CSSProperties } from 'react'

export const pageStyle: CSSProperties = {
	padding: 24,
}

export const pageTitleStyle: CSSProperties = {
	color: 'rgba(0, 0, 0, 0.88)',
	fontFamily: '"Segoe UI"',
	fontSize: '24px',
	fontWeight: 600,
	lineHeight: '32px',
	marginBottom: 24,
	textAlign: 'left',
}

export const stepsStyle: CSSProperties = {
	marginBottom: 24,
}

export const stepContentWrapperStyle: CSSProperties = {
	marginBottom: 24,
}

export const footerButtonsStyle: CSSProperties = {
	display: 'flex',
	justifyContent: 'space-between',
}

export const stepZeroContentStyle: CSSProperties = {
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'flex-start',
}

export const formColumnStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
}

export const fieldLabelStyle: CSSProperties = {
	marginBottom: 8,
	color: 'rgba(0, 0, 0, 0.88)',
	fontFamily: '"Segoe UI"',
	fontSize: '16px',
	fontWeight: 400,
	lineHeight: '21px',
}

export const specialtyLabelStyle: CSSProperties = {
	...fieldLabelStyle,
	width: '400px',
}

export const selectStyle: CSSProperties = {
	width: 350,
}

export const doctorCardStyle: CSSProperties = {
	display: 'flex',
	width: '513px',
	height: '188px',
	padding: '0.833px',
	flexDirection: 'column',
	alignItems: 'flex-start',
	borderRadius: '12px',
	border: '0.833px solid #ADC6FF',
	background: '#F0F5FF',
}

export const doctorCardHeaderStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'flex-start',
	marginBottom: 8,
}

export const doctorAvatarStyle: CSSProperties = {
	marginRight: 12,
}

export const doctorNameStyle: CSSProperties = {
	color: 'rgba(0, 0, 0, 0.88)',
	fontFamily: '"Segoe UI"',
	fontSize: '24px',
	fontWeight: 600,
	lineHeight: '28px',
}

export const doctorPriceStyle: CSSProperties = {
	marginTop: 4,
	color: '#000',
	fontSize: '16px',
	fontStyle: 'normal',
	fontWeight: 700,
	lineHeight: '22px',
}

export const doctorMetaStyle: CSSProperties = {
	marginLeft: 60,
	marginTop: 8,
}

export const doctorRatingRowStyle: CSSProperties = {
	marginBottom: 8,
}

export const stepOneContentStyle: CSSProperties = {
	display: 'flex',
}

export const calendarColumnStyle: CSSProperties = {
	marginRight: 32,
}

export const strongFieldLabelStyle: CSSProperties = {
	marginBottom: 8,
	color: 'rgba(0, 0, 0, 0.88)',
	fontFamily: '"Segoe UI"',
	fontSize: '16px',
	fontWeight: 600,
	lineHeight: '22px',
}

export const calendarStyle: CSSProperties = {
	width: '400px',
}

export const timeSlotsStyle: CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: 8,
}

export const selectedTimeButtonStyle: CSSProperties = {
	backgroundColor: '#d9d9d9',
}

export const alertStyle: CSSProperties = {
	marginBottom: 16,
}

export const confirmationTableWrapperStyle: CSSProperties = {
	display: 'flex',
	justifyContent: 'center',
}

export const confirmationLabelStyle: CSSProperties = {
	color: 'rgba(0, 0, 0, 0.45)',
	fontFamily: '"Segoe UI"',
	fontSize: '14px',
	fontWeight: 400,
	lineHeight: '22px',
	textAlign: 'center',
}

export const confirmationValueStyle: CSSProperties = {
	color: 'rgba(0, 0, 0, 0.88)',
	fontFamily: '"Segoe UI"',
	fontSize: '14px',
	fontWeight: 600,
	lineHeight: '22px',
	textAlign: 'center',
}
