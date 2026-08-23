import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../../pages/LoginPage';

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

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/patient/main" element={<div>Patient Home Route</div>} />
        <Route path="/doctor/main" element={<div>Doctor Home Route</div>} />
        <Route path="/admin/main" element={<div>Admin Home Route</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function getInputs() {
  return Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('renders required fields and submit button', () => {
    mockedUseAuth.mockReturnValue(createAuthValue());

    renderLoginPage();
    const [emailInput, passwordInput] = getInputs();

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('submits entered credentials to auth login handler', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({
      login: vi.fn(async () => undefined),
    });
    mockedUseAuth.mockReturnValue(auth);

    renderLoginPage();
    const [emailInput, passwordInput] = getInputs();

    await user.type(emailInput!, 'patient@example.com');
    await user.type(passwordInput!, 'P@ssw0rd');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith('patient@example.com', 'P@ssw0rd');
    });
  });

  it('redirects to patient home after successful login', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue();
    auth.login = vi.fn(async () => {
      auth.token = 'token-123';
      auth.user = {
        id: 'u-1',
        email: 'patient@example.com',
        displayName: 'Patient User',
      };
      auth.role = 'Patient';
      auth.isAuthenticated = true;
    });
    mockedUseAuth.mockImplementation(() => auth);

    renderLoginPage();
    const [emailInput, passwordInput] = getInputs();

    await user.type(emailInput!, 'patient@example.com');
    await user.type(passwordInput!, 'P@ssw0rd');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByText('Patient Home Route')).toBeInTheDocument();
  });

  it('shows an error message when login fails', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({
      login: vi.fn(async () => {
        throw new ApiError(401, { detail: 'Invalid credentials' });
      }),
    });
    mockedUseAuth.mockReturnValue(auth);

    renderLoginPage();
    const [emailInput, passwordInput] = getInputs();

    await user.type(emailInput!, 'patient@example.com');
    await user.type(passwordInput!, 'wrong-password');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
