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
	flexWrap: "wrap",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 16,
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

export const doctorNameStyle: CSSProperties = {
	color: 'var(--character-title-85, rgba(0, 0, 0, 0.85))',
	fontSize: '16px',
	fontStyle: 'normal',
	fontWeight: 700,
	lineHeight: '22px',
	whiteSpace: 'nowrap', // Свойство white-space указывает браузеру, как обрабатывать пробелы в тексте, подряд идущие пробелы и переносы строк обрабатываются так же, как и с normal, но браузер перестаёт учитывать границы элемента и выводит весь текст в одну строку
	overflow: 'hidden',
	textOverflow: 'ellipsis',
}

export const doctorSpecStyle: CSSProperties = {
	color: '#8C8C8C',
	fontSize: '16px',
	fontStyle: 'normal',
	fontWeight: 400,
	lineHeight: '22px',
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis', // войство text-overflow определяет, как будет обрезаться текст, если он не влезает в доступную область полностью. Работает только в сочетании с white-space: nowrap и overflow: hidden. ellipsis — при обрезке текста в конце строки добавляется многоточие «…», показывая незавершённость предложения
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

export const fieldLabelStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.88)",
	textAlign: "left",
	fontFamily: '"Segoe UI"',
	fontSize: 14,
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "22px",
	margin: 0,
}

export const doctorCellRowStyle: CSSProperties = {
	display: "flex",
	gap: 12,
	alignItems: "center",
}

export const doctorCellAvatarWrapStyle: CSSProperties = {
	flex: "0 0 auto",
}

export const doctorCellTextColStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 2,
	minWidth: 0,
}

export const actionsCellStyle: CSSProperties = { paddingRight: 8 }

export const cardStyle: CSSProperties = { borderRadius: 16 }
export const cardStyles = { body: { padding: 16 } }

export const cardLayoutStyle: CSSProperties = {
	display: "flex",
	flexDirection: "row",
	flexWrap: "wrap",
	gap: 24,
	alignItems: "flex-start",
	width: "100%",
	boxSizing: "border-box",
}

export const calendarWrapStyle: CSSProperties = {
	width: "min(350px, 100%)",
	flex: "0 1 350px",
	boxSizing: "border-box",
}

export const fullWidthStyle: CSSProperties = { width: "100%" }

export const rightPanelStyle: CSSProperties = {
	flex: "1 1 480px",
	minWidth: 0,
	display: "flex",
	flexDirection: "column",
	gap: 12,
}

export const tableStyle: CSSProperties = { width: "100%" }

export const slotModalStyles = {
	container: {
		borderRadius: 10,
		background: "#FFF",
		boxShadow:
			"0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
		height: 548,
		display: "flex",
		flexDirection: "column",
	} satisfies CSSProperties,
	body: {
		padding: 24,
		flex: 1,
		overflow: "hidden",
		display: "flex",
	} satisfies CSSProperties,
}

export const modalFormStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	height: "100%",
	flex: 1,
	minWidth: 0,
}

export const modalBodyScrollAddStyle: CSSProperties = {
	flex: 1,
	display: "flex",
	flexDirection: "column",
	gap: 12,
	overflow: "auto",
	textAlign: "left",
}

export const modalBodyScrollEditStyle: CSSProperties = {
	flex: 1,
	display: "flex",
	flexDirection: "column",
	gap: 12,
	overflow: "auto",
}

export const timeRowStyle: CSSProperties = { display: "flex", gap: 16 }

export const timeColStyle: CSSProperties = {
	flex: 1,
	minWidth: 0,
	display: "flex",
	flexDirection: "column",
	gap: 8,
}

export const modalFooterStyle: CSSProperties = {
	display: "flex",
	justifyContent: "flex-end",
	gap: 8,
	marginTop: 16,
}

export const formItemNoMarginStyle: CSSProperties = { margin: 0 }

