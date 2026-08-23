import type { CSSProperties } from "react"

export const pageStyle: CSSProperties = { padding: "24px" }

export const headerRowStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
}

export const headerTitleStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: "24px",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "30.4px",
	margin: 0,
}

export const noteStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.45)",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "20.429px",
	marginTop: "12px",
}

export const dateStyle: CSSProperties = {
	color: "#000",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "20.429px",
}

export const nameStyle: CSSProperties = {
	color: "var(--character-title-85, rgba(0, 0, 0, 0.85))",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 700,
	lineHeight: "20.429px",
	margin: 0,
}

export const specialtyTextStyle: CSSProperties = {
	color: "var(--subtext, #8C8C8C)",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "20.429px",
	margin: 0,
}

export const diagnosisStyle: CSSProperties = {
	color: "var(--character-title-85, rgba(0, 0, 0, 0.85))",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "20.429px",
}

export const appointmentCellRowStyle: CSSProperties = {
	display: "flex",
	gap: "8px",
	alignItems: "center",
}

export const selectStyle: CSSProperties = { width: 200 }

export const statusBadgeStyle: CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: 8,
}

export const statusDotStyle: CSSProperties = {
	width: 6,
	height: 6,
	borderRadius: '50%',
	flexShrink: 0,
}

export const statusTextStyle: CSSProperties = {
	display: 'inline-block',
	maxWidth: 78,
	whiteSpace: 'normal',
	lineHeight: '20px',
	wordBreak: 'normal',
	overflowWrap: 'break-word',
}
