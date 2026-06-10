import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { AuthUser } from '@/types';

export const COOKIE_NAME = 'ax-wall-token';

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret-change-me');
}

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ id: user.id, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { id: payload.id as string, name: payload.name as string };
  } catch {
    return null;
  }
}

export function verifyTokenSync(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.id || !payload.name) return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: payload.id, name: payload.name };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
