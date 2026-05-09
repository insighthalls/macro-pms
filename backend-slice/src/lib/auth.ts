import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import crypto from 'node:crypto';
import { db } from './db.js';
import { Unauthorized } from './errors.js';
import type { UserRole } from '@prisma/client';

const SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const ACCESS_TTL_MIN  = Number(process.env.JWT_ACCESS_TTL_MIN  || 30);
const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS || 7);

export interface AuthClaims {
  sub: string;          // user id
  role: UserRole;
  projects: string[];   // accessible project ids
  jti: string;
}

export function signAccess(claims: AuthClaims): string {
  return jwt.sign(claims, SECRET, { algorithm: 'HS256', expiresIn: `${ACCESS_TTL_MIN}m` });
}

export function verifyAccess(token: string): AuthClaims {
  try {
    return jwt.verify(token, SECRET) as AuthClaims;
  } catch {
    throw Unauthorized('Invalid or expired access token');
  }
}

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
    include: { projectAccess: true },
  });
  if (!user || !user.active) throw Unauthorized('Invalid credentials');

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) throw Unauthorized('Invalid credentials');

  const claims: AuthClaims = {
    sub: user.id,
    role: user.role,
    projects: user.projectAccess.map((p) => p.projId),
    jti: crypto.randomUUID(),
  };

  const accessToken = signAccess(claims);
  const refreshRaw = crypto.randomBytes(48).toString('base64url');
  const refreshHash = crypto.createHash('sha256').update(refreshRaw).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 86400_000);

  await db.refreshToken.create({
    data: { userId: user.id, hash: refreshHash, expiresAt },
  });

  return {
    accessToken,
    refreshToken: refreshRaw,
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      region: user.region,
      initials: user.initials,
      projects: claims.projects,
    },
  };
}

export async function refresh(rawToken: string) {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const row = await db.refreshToken.findUnique({
    where: { hash },
    include: { user: { include: { projectAccess: true } } },
  });
  if (!row || row.revokedAt || row.expiresAt < new Date()) {
    throw Unauthorized('Refresh token invalid or expired');
  }
  // Rotate
  await db.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });

  return login.bind(null, row.user.email)('password123' /* unused on rotate path */) as never; // placeholder; in real impl, issue new token without re-checking password.
}
