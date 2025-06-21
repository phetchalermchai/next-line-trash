import { jwtDecode } from 'jwt-decode';
import { getCookie } from 'cookies-next';

export interface JwtPayload {
    sub: string;
    email?: string;
    role: string;
    [key: string]: any;
}

export function decodeToken(token: string): JwtPayload {
    return jwtDecode<JwtPayload>(token);
}

export function getUserFromToken(): JwtPayload | null {
  const token = getCookie('accessToken');
  if (!token || typeof token !== 'string') return null;
  try {
    return decodeToken(token);
  } catch {
    return null;
  }
}

export function isAdminUser(): boolean {
  const user = getUserFromToken();
  return user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
}

export function isSuperadminUser(): boolean {
  const user = getUserFromToken();
  return user?.role === 'SUPERADMIN';
}