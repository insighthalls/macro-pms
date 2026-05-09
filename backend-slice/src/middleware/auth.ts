import type { Request, Response, NextFunction } from 'express';
import { verifyAccess, type AuthClaims } from '../lib/auth.js';
import { Unauthorized, Forbidden } from '../lib/errors.js';
import type { UserRole } from '@prisma/client';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const h = req.header('authorization') || '';
  const m = /^Bearer\s+(.+)$/.exec(h);
  if (!m) throw Unauthorized();
  req.auth = verifyAccess(m[1]!);
  next();
}

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw Unauthorized();
    if (!allowed.includes(req.auth.role)) {
      throw Forbidden(`Role ${req.auth.role} cannot perform this action (need: ${allowed.join(', ')})`);
    }
    next();
  };
}

export function requireProjectAccess(getProj: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw Unauthorized();
    const proj = getProj(req);
    if (!proj) return next();
    if (!req.auth.projects.includes(proj)) throw Forbidden(`No access to project ${proj}`);
    next();
  };
}
