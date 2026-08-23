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

export const doctorNameTextStyle: CSSProperties = {
	color: "var(--character-title-85, rgba(0, 0, 0, 0.85))",
	fontSize: 14,
	fontStyle: "normal",
	fontWeight: 700,
	lineHeight: "22px",
}

export const doctorEmailTextStyle: CSSProperties = {
	color: "#8C8C8C",
	fontSize: 14,
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "22px",
}

export const rootStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
	width: '100%',
	boxSizing:
		'border-box' /* При помощи свойства box-sizing можно изменить то, как браузер будет рассчитывать размеры элемента. border-box — значение width и height являются финальными размерами элемента. Финальная ширина = ширина */,
}

export const headerRowStyle: CSSProperties = {
	display: "flex",
	alignItems: "flex-end",
	justifyContent: "space-between",
	gap: "16px",
}

export const statCardsRowStyle: CSSProperties = {
	display: "flex",
	gap: 16,
	width: "100%",
}

export const statCardStyle: CSSProperties = {
	display: 'flex',
	height: '111.576px',
	padding: '23.997px 23.997px 0 23.997px',
	flexDirection: 'column',
	alignItems: 'flex-start',
	flexShrink: 0, //указывает, насколько элемент уменьшится (уступит место) относительно других, если в контейнере не хватает места
	alignSelf: 'stretch',
	background: '#fff',
	border: '1px solid #f0f0f0',
	borderRadius: 8,
	flex: 1,
}

export const statLabelStyle: CSSProperties = {
	color: "rgba(0, 0, 0, 0.45)",
	fontFamily: '"Segoe UI"',
	fontSize: 16,
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "22px",
}

const statValueBaseStyle: CSSProperties = {
	fontFamily: '"Segoe UI"',
	fontSize: 24,
	fontStyle: "normal",
	fontWeight: 700,
	lineHeight: "33.6px",
}

// ... - оператор расширения, в базовые свойства копируется или добавляется новое свойство
export const activeStatValueStyle: CSSProperties = { ...statValueBaseStyle, color: "#52C41A" }
export const vacationStatValueStyle: CSSProperties = { ...statValueBaseStyle, color: "#FA8C16" }
export const inactiveStatValueStyle: CSSProperties = { ...statValueBaseStyle, color: "#8C8C8C" }

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
	overflowX: "auto", // обрезает то, что не поместилось в блок, добавляя скролл-бар
}

export const tableStyle: CSSProperties = {
	width: "100%",
}

export const doctorModalStyles = {
	container: {
		borderRadius: 10,
		background: '#FFF',
		boxShadow:
			'0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
		height: 589,
		display: 'flex',
		flexDirection: 'column',
	} satisfies CSSProperties, // проверить, что объект соответствует CSSProperties, но оставить исходный тип объекта
	body: {
		padding: 24,
		flex: 1, // элемент растёт и сжимается, чтобы занять всё доступное место в контейнере
		overflow: 'hidden',
		display: 'flex',
		flexDirection: 'column',
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

