const DEFAULT_DEV_API_URL = 'http://localhost:5057';

export const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL?.trim() || DEFAULT_DEV_API_URL)
  : '';

export const HUB_URLS = {
  doctorSlots: `${API_BASE_URL}/hubs/doctor-slots`,
} as const;

export { DEFAULT_DEV_API_URL };
