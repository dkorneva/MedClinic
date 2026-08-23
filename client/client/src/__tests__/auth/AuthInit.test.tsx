import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequireAuth } from '../../components/RequireAuth';
import { AuthProvider } from '../../contexts/AuthContext';
import { renderWithProviders } from '../../test/renderWithProviders';

function renderAuthInitRoute() { // рендеринг компонентов для тестирования инициализации аутентификации
  return renderWithProviders(
    <AuthProvider>
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
    </AuthProvider>,
    { route: '/private' },
  );
}

describe('Auth initialization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('restores authenticated state from token and allows protected route access', async () => {
    localStorage.setItem('token', 'token-123');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'u-1',
          email: 'patient@example.com',
          displayName: 'Patient User',
          role: 'Patient',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    renderAuthInitRoute();

    expect(await screen.findByText('Protected Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      }),
    );
  });

  it('keeps user unauthenticated and redirects to login when token is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderAuthInitRoute();

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
