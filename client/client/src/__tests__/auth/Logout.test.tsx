import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppLayout from '../../components/AppLayout';
import { RequireAuth } from '../../components/RequireAuth';
import { AuthProvider } from '../../contexts/AuthContext';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('Logout behavior', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears auth state and redirects to login after logout', async () => {
    const user = userEvent.setup();

    localStorage.setItem('token', 'token-123');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
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

    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/patient/tickets" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </AuthProvider>,
      { route: '/patient/tickets' },
    );

    expect(await screen.findByText('Protected Content')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /выйти/i }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
