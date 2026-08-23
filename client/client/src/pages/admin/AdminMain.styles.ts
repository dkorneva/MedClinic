import type { CSSProperties } from 'react';

export const headerStyle: CSSProperties = {
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #722ED1 0%, #531DAB 100%)',
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

export const titleStyle: CSSProperties = {
  color: '#FFF',
  fontFamily: '"Segoe UI"',
  fontSize: '24px',
  fontStyle: 'normal',
  fontWeight: 600,
  lineHeight: '32px',
  margin: 0,
};

export const subtitleStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.85)',
  fontFamily: '"Segoe UI"',
  fontSize: '14px',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: '22px',
  margin: 0,
};

export const appointmentNameStyle: CSSProperties = {
  color: 'var(--character-title-85, rgba(0, 0, 0, 0.85))',
  fontSize: '14px',
  fontStyle: 'normal',
  fontWeight: 700,
  lineHeight: '22px',
};

export const appointmentMetaStyle: CSSProperties = {
  color: '#D9D9D9',
  fontSize: '14px',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: '22px',
};

export const appointmentMetaClampStyle: CSSProperties = { ...appointmentMetaStyle, minWidth: 0 };

export const appointmentTimeStyle: CSSProperties = {
  color: 'var(--error, #FF4D4F)',
  fontSize: '14px',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: '22px',
  whiteSpace: 'nowrap',
};

export const doctorNameStyle: CSSProperties = {
  color: 'var(--character-title-85, rgba(0, 0, 0, 0.85))',
  fontSize: '14px',
  fontStyle: 'normal',
  fontWeight: 700,
  lineHeight: '22px',
};

export const doctorSpecStyle: CSSProperties = {
  color: 'rgba(217, 217, 217, 0.85)',
  fontSize: '14px',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: '22px',
};

export const appointmentRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
};

export const rowTextColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  flex: 1,
};

export const doctorsRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  width: '100%',
  minWidth: 0,
};

export const tablesRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  marginTop: '24px',
};

export const tableColumnStyle: CSSProperties = { width: '100%' };
