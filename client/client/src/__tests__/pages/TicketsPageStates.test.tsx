import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { getCategories } from '../../api/categories';
import { getTickets } from '../../api/tickets';
import TicketsPage from '../../pages/patient/TicketsPage';
import { renderWithProviders } from '../../test/renderWithProviders';

vi.mock('../../api/tickets', async () => {
  const actual = await vi.importActual<typeof import('../../api/tickets')>('../../api/tickets');

  return {
    ...actual,
    getTickets: vi.fn(),
  };
});

vi.mock('../../api/categories', async () => {
  const actual = await vi.importActual<typeof import('../../api/categories')>('../../api/categories');

  return {
    ...actual,
    getCategories: vi.fn(),
  };
});

const getTicketsMock = vi.mocked(getTickets);
const getCategoriesMock = vi.mocked(getCategories);

describe('TicketsPage states', () => {
  beforeEach(() => {
    getTicketsMock.mockReset();
    getCategoriesMock.mockReset();
  });

  it('renders loading state while tickets are being fetched', () => {
    getTicketsMock.mockReturnValue(new Promise(() => undefined) as ReturnType<typeof getTickets>);
    getCategoriesMock.mockResolvedValue([]);

    renderWithProviders(<TicketsPage />, { route: '/patient/tickets' });

    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('renders error state when loading tickets fails', async () => {
    getTicketsMock.mockRejectedValue(new ApiError(500, { detail: 'Failed to load tickets' }));
    getCategoriesMock.mockResolvedValue([]);

    renderWithProviders(<TicketsPage />, { route: '/patient/tickets' });

    expect(await screen.findByText('Failed to load tickets')).toBeInTheDocument();
  });

  it('renders empty state when there are no tickets', async () => {
    getTicketsMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });
    getCategoriesMock.mockResolvedValue([]);

    renderWithProviders(<TicketsPage />, { route: '/patient/tickets' });

    expect(await screen.findByText('Записи пока не найдены')).toBeInTheDocument();
  });
});
