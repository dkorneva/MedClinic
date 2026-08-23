import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequireAuth } from '../../components/RequireAuth';
import { useAuth } from '../../contexts/AuthContext';

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
    token: null,
    user: null,
    role: null,
    isAuthenticated: false,
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    logout: vi.fn(),
    init: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('Route protection', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('redirects unauthenticated users from protected route to login', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ isAuthenticated: false }));

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>Protected Page</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
  });

  it('allows authenticated users to access protected route', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ isAuthenticated: true }));

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>Protected Page</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('keeps public route accessible without authentication', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ isAuthenticated: false }));

    render(
      <MemoryRouter initialEntries={['/public']}>
        <Routes>
          <Route path="/public" element={<div>Public Page</div>} />
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>Protected Page</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Public Page')).toBeInTheDocument();
  });
});
