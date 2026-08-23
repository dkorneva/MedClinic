import type { CSSProperties } from "react"

export const titleStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: "24px",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "32px",
	margin: 0,
}

export const weekStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "22px",
	margin: "8px 0",
}

export const buttonStyle: CSSProperties = {
	display: "flex",
	width: "175px",
	height: "130px",
	padding: "4px 15px",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
	borderRadius: "2px",
	border: "1px solid #D9D9D9",
	boxShadow: "0 2px 0 0 rgba(0, 0, 0, 0.02)",
	textAlign: "center",
}

export const patientNameStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.85)",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 700,
	lineHeight: "22px",
}

export const patientAgeStyle: CSSProperties = {
	color: "#D9D9D9",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "22px",
}

export const appointmentsTitleStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "25.143px",
	margin: 0,
}

export const patientCellRowStyle: CSSProperties = {
	display: "flex",
	gap: "12px",
	alignItems: "center",
}

export const daysRowStyle: CSSProperties = {
	display: "flex",
	gap: "10px",
	justifyContent: "center",
}

export const dayButtonContentStyle: CSSProperties = { textAlign: "center" }

export const dayButtonDateStyle: CSSProperties = {
	fontSize: "24px",
	fontWeight: 700,
}

export const mainRowStyle: CSSProperties = {
	display: "flex",
	gap: "24px",
	marginTop: "24px",
}

export const calendarColStyle: CSSProperties = { width: "350px" }
export const appointmentsColStyle: CSSProperties = { flex: 1 }

export const emptyStateWrapStyle: CSSProperties = {
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	minHeight: "320px",
}
