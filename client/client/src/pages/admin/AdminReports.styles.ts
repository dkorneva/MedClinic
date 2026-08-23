import type { CSSProperties } from "react"

export const pageStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 16,
	width: "100%",
	boxSizing: "border-box",
}

export const headerRowStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 16,
	flexWrap: "wrap",
}

export const headerControlsStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 12,
	flexWrap: "wrap",
}

export const titleStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: "24px",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "32px",
	margin: 0,
}

export const statGridStyle: CSSProperties = {
	display: "flex",
	gap: 16,
	width: "100%",
	flexWrap: "wrap",
}

export const statCardStyle: CSSProperties = {
	display: "flex",
	minHeight: 112,
	padding: "24px",
	flexDirection: "column",
	alignItems: "flex-start",
	justifyContent: "space-between",
	flex: "1 1 220px",
	background: "#fff",
	border: "1px solid #f0f0f0",
	borderRadius: 8,
	boxSizing: "border-box",
}

export const statLabelStyle: CSSProperties = {
	color: "#8C8C8C",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "17.286px",
	margin: 0,
}

const statValueBaseStyle: CSSProperties = {
	fontFamily: '"Segoe UI"',
	fontSize: "24px",
	fontStyle: "normal",
	fontWeight: 700,
	lineHeight: "22px",
}

export const getStatValueStyle = (color: string): CSSProperties => ({
	...statValueBaseStyle,
	color,
})

export const analyticsRowStyle: CSSProperties = {
	display: "flex",
	gap: 16,
	width: "100%",
	flexWrap: "wrap",
}

export const panelStyle: CSSProperties = {
	background: "#fff",
	border: "1px solid #f0f0f0",
	borderRadius: 8,
	padding: "24px",
	boxSizing: "border-box",
	flex: "1 1 420px",
	minWidth: 0,
}

export const panelTitleStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: 16,
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "24px",
	margin: 0,
	marginBottom: 16,
}

export const chartWrapperStyle: CSSProperties = {
	display: "grid",
	gridTemplateColumns: "48px 1fr",
	gridTemplateRows: "1fr auto",
	gap: 8,
	alignItems: "stretch",
}

export const chartScrollContainerStyle: CSSProperties = {
	width: "100%",
	maxWidth: "100%",
	overflowX: "auto",
	overflowY: "hidden",
}

export const chartYAxisStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	justifyContent: "space-between",
	alignItems: "flex-end",
	color: "#8C8C8C",
	fontFamily: '"Segoe UI"',
	fontSize: 12,
	lineHeight: "16px",
	paddingBottom: 24,
	boxSizing: "border-box",
}

export const chartPlotAreaStyle: CSSProperties = {
	position: "relative",
	borderLeft: "1px solid #E5E7EB",
	borderBottom: "1px solid #E5E7EB",
	padding: "8px 12px 8px 12px",
	height: 240,
	boxSizing: "border-box",
	display: "flex",
	alignItems: "flex-end",
	gap: 12,
	background:
		"linear-gradient(to top, rgba(0,0,0,0.05) 1px, transparent 1px) 0 0/100% 20%",
}

export const chartXAxisStyle: CSSProperties = {
	gridColumn: "2 / 3",
	display: "flex",
	justifyContent: "space-between",
	color: "#8C8C8C",
	fontFamily: '"Segoe UI"',
	fontSize: 12,
	lineHeight: "16px",
	padding: "0 12px",
}

const chartBarBaseStyle: CSSProperties = {
	flex: 1,
	borderRadius: 6,
	background: "#722ED1",
}

export const getChartBarStyle = (heightPercent: number): CSSProperties => ({
	...chartBarBaseStyle,
	height: `${heightPercent}%`, // Создаём свойство height в объекте стилей, значение формируется как строка с процентами
})

export const doctorRowStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 16,
}

export const doctorLineStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 8,
}

export const doctorNameStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: 14,
	fontStyle: "normal",
	fontWeight: 500,
	lineHeight: "20px",
	margin: 0,
}
