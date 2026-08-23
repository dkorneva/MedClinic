import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppLayout from '../../components/AppLayout';
import { RequireRole } from '../../components/RequireRole';
import { useAuth } from '../../contexts/AuthContext';
import { renderWithProviders } from '../../test/renderWithProviders';

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../contexts/AuthContext')>(
    '../../contexts/AuthContext',
  );

  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

type AuthValue = ReturnType<typeof useAuth>;

const mockedUseAuth = vi.mocked(useAuth);

function createAuthValue(overrides: Partial<AuthValue> = {}): AuthValue {
  return {
    token: 'token-123',
    user: {
      id: 'u-1',
      email: 'user@example.com',
      displayName: 'Test User',
    },
    role: 'Patient',
    isAuthenticated: true,
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    logout: vi.fn(),
    init: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderLayout(route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="*" element={<div>Page Content</div>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('Role-based behavior', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('shows patient navigation and hides admin links for Patient role', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ role: 'Patient' }));

    renderLayout('/patient/tickets');

    expect(document.querySelector('a[href="/patient/tickets"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/patient/tickets/new"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/admin/categories"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/admin/users"]')).not.toBeInTheDocument();
  });

  it('shows admin navigation and hides patient links for Admin role', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ role: 'Admin' }));

    renderLayout('/admin/categories');

    expect(document.querySelector('a[href="/admin/categories"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/admin/users"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/patient/tickets"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/patient/tickets/new"]')).not.toBeInTheDocument();
  });

  it('blocks Patient from Admin-only content', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ role: 'Patient' }));

    renderWithProviders(
      <Routes>
        <Route
          path="/admin-only"
          element={
            <RequireRole roles={['Admin']}>
              <div>Admin-only content</div>
            </RequireRole>
          }
        />
      </Routes>,
      { route: '/admin-only' },
    );

    expect(document.body).toHaveTextContent('You do not have permission to access this page.');
    expect(document.body).not.toHaveTextContent('Admin-only content');
  });
});
