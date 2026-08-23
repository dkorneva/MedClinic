import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import RegisterPage from '../../pages/RegisterPage';
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

function getInputs() {
  return Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
}

function renderRegisterPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/patient/main" element={<div>Patient Home Route</div>} />
      <Route path="/doctor/main" element={<div>Doctor Home Route</div>} />
      <Route path="/admin/main" element={<div>Admin Home Route</div>} />
    </Routes>,
    { route: '/register' },
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('renders required fields and submit button', () => {
    mockedUseAuth.mockReturnValue(createAuthValue());

    renderRegisterPage();
    const [displayNameInput, emailInput, passwordInput, confirmPasswordInput] = getInputs();

    expect(displayNameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('submits entered registration data and redirects after success', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue();
    auth.register = vi.fn(async () => {
      auth.token = 'token-123';
      auth.user = {
        id: 'u-1',
        email: 'new.patient@example.com',
        displayName: 'New Patient',
      };
      auth.role = 'Patient';
      auth.isAuthenticated = true;
    });
    mockedUseAuth.mockImplementation(() => auth);

    renderRegisterPage();
    const [displayNameInput, emailInput, passwordInput, confirmPasswordInput] = getInputs();

    await user.type(displayNameInput!, 'New Patient');
    await user.type(emailInput!, 'new.patient@example.com');
    await user.type(passwordInput!, 'P@ssw0rd');
    await user.type(confirmPasswordInput!, 'P@ssw0rd');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(auth.register).toHaveBeenCalledWith(
        'New Patient',
        'new.patient@example.com',
        'P@ssw0rd',
        'Patient',
      );
    });

    expect(await screen.findByText('Patient Home Route')).toBeInTheDocument();
  });

  it('shows an error message when registration fails', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({
      register: vi.fn(async () => {
        throw new ApiError(400, { detail: 'Email is already registered.' });
      }),
    });
    mockedUseAuth.mockReturnValue(auth);

    renderRegisterPage();
    const [displayNameInput, emailInput, passwordInput, confirmPasswordInput] = getInputs();

    await user.type(displayNameInput!, 'Existing User');
    await user.type(emailInput!, 'existing@example.com');
    await user.type(passwordInput!, 'P@ssw0rd');
    await user.type(confirmPasswordInput!, 'P@ssw0rd');
    await user.click(screen.getByRole('button'));

    expect(await screen.findByText('Email is already registered.')).toBeInTheDocument();
  });
});
