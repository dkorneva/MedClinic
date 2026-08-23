import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import PageLoading from '../../../components/PageLoading';
import { ApiError } from '../../../shared/api/http/client';
import { tokenStorage } from '../../../shared/lib/auth/tokenStorage';
import { getCurrentUser, loginRequest, registerRequest } from '../api/authApi';
import type { AuthUser, Role } from './types';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  login(email: string, password: string): Promise<void>;
  register(displayName: string, email: string, password: string, role: Role): Promise<void>;
  logout(): void;
  init(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const logout = () => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const init = async (): Promise<void> => {
    const storedToken = tokenStorage.get();

    if (!storedToken) {
      logout();
      return;
    }

    setToken(storedToken);

    try {
      const me = await getCurrentUser();
      setUser({ id: me.id, email: me.email, displayName: me.displayName });
      setRole(me.role);
    } catch (error) {
      if (error instanceof ApiError || error instanceof TypeError) {
        logout();
        return;
      }

      throw error;
    }
  };

  useEffect(() => {
    init().finally(() => setIsInitialized(true));
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { accessToken } = await loginRequest({ email, password });
    tokenStorage.set(accessToken);
    setToken(accessToken);
    await init();
  };

  const register = async (
    displayName: string,
    email: string,
    password: string,
    roleValue: Role,
  ): Promise<void> => {
    const { accessToken } = await registerRequest({
      displayName,
      email,
      password,
      role: roleValue,
    });

    tokenStorage.set(accessToken);
    setToken(accessToken);
    await init();
  };

  if (!isInitialized) {
    return <PageLoading />;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        init,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
