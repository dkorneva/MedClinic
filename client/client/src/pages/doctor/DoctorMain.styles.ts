import type { CSSProperties } from "react"

export const headerStyle: CSSProperties = {
	borderRadius: "16px",
	background: "linear-gradient(135deg, #52C41A 0%, #389E0D 100%)",
	padding: "32px",
	display: "flex",
	flexDirection: "column",
	gap: "12px",
}

export const titleStyle: CSSProperties = {
	color: "#FFF",
	fontFamily: '"Segoe UI"',
	fontSize: "24px",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "32px",
	margin: 0,
}

export const subtitleStyle: CSSProperties = {
	color: "rgba(255, 255, 255, 0.85)",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "20.429px",
	margin: 0,
}

export const patientNameStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "22px",
}

export const timeStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.45)",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "20.429px",
}

export const complaintStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.45)",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "20.429px",
}

export const dayStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: "16px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "22px",
}

export const scheduleTextStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.45)",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "18.857px",
}

export const rowBetweenStyle: CSSProperties = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
}

export const mainRowStyle: CSSProperties = {
	display: "flex",
	gap: "24px",
	marginTop: "24px",
}

export const colFlexStyle: CSSProperties = { flex: 1 }
// flex-grow: 1
// Элемент может расти, чтобы занять доступное пространство.
// Чем больше значение, тем больше элемент “тянется”.
// flex-shrink: 1
// Элемент может сжиматься, если места мало.
// flex-basis: 0%
// Исходный размер элемента считается равным 0, всё пространство распределяется по flex-grow.
