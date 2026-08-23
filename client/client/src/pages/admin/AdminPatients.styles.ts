import type { CSSProperties } from "react"

export const titleStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: "24px",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "30.4px",
	margin: 0,
}

export const subtitleStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.45)",
	fontFamily: '"Segoe UI"',
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "22px",
	margin: 0,
}

export const patientNameStyle: CSSProperties = {
	color: "var(--character-title-85, rgba(0, 0, 0, 0.85))",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 700,
	lineHeight: "22px",
}

export const patientEmailStyle: CSSProperties = {
	color: "#666",
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "22px",
}

export const modalTitleStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	fontFamily: '"Segoe UI"',
	fontSize: 16,
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "24px",
	margin: 0,
}

export const modalFieldLabelStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	textAlign: "left",
	fontFamily: '"Segoe UI"',
	fontSize: 14,
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "22px",
	margin: 0,
}

export const nameCellRowStyle: CSSProperties = {
	display: "flex",
	gap: "12px",
	alignItems: "center",
}

export const nameCellTextColStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: "2px",
}

export const actionsRowStyle: CSSProperties = {
	display: "flex",
	gap: "8px",
}

export const actionButtonStyle: CSSProperties = { minWidth: "120px" }

export const rootStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 16,
	width: "100%",
	boxSizing: "border-box",
}

export const headerRowStyle: CSSProperties = {
	display: "flex",
	alignItems: "flex-end",
	justifyContent: "space-between",
	gap: "16px",
}

export const searchRowStyle: CSSProperties = {
	display: 'flex',
	justifyContent: 'space-between',
	flexWrap: 'wrap', // Позволяет флекс-элементам переноситься на новые строки, т.к. флекс-элементы по умолчанию стараются уместиться в один ряд, даже если размер им не позволяет
}

export const searchInputStyle: CSSProperties = {
	maxWidth: "320px",
	width: "100%",
}

export const tableWrapperStyle: CSSProperties = {
	width: "100%",
	overflowX: "auto",
}

export const tableStyle: CSSProperties = {
	width: "100%",
}

export const patientModalStyles = {
	container: {
		borderRadius: 10,
		background: "#FFF",
		boxShadow:
			"0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
		height: 589,
		display: "flex",
		flexDirection: "column",
	} satisfies CSSProperties,
	body: {
		padding: 24,
		flex: 1,
		overflow: "hidden",
		display: "flex",
		flexDirection: "column",
	} satisfies CSSProperties,
}

export const modalFormStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	height: "100%",
	flex: 1,
	minWidth: 0,
}

export const modalBodyScrollStyle: CSSProperties = {
	flex: 1,
	display: "flex",
	flexDirection: "column",
	gap: 12,
	overflow: "auto",
	textAlign: "left",
}

export const modalFooterStyle: CSSProperties = {
	display: "flex",
	justifyContent: "flex-end",
	gap: 8,
	marginTop: 16,
}

export const formItemNoMarginStyle: CSSProperties = { margin: 0 }
export const inputLeftTextStyle: CSSProperties = { textAlign: "left" }
export const fullWidthLeftTextStyle: CSSProperties = { width: "100%", textAlign: "left" }

