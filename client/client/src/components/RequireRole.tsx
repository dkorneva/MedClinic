import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../contexts/AuthContext';
import ForbiddenPage from '../pages/ForbiddenPage';

interface Props {
  roles: Role[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: Props) {
	const { role } = useAuth()

	if (!role || !roles.includes(role)) return <ForbiddenPage />
	return <>{children}</> 
}
