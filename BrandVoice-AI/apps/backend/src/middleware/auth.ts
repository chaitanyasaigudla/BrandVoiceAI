import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from './errorHandler';
import { prisma } from '../lib/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  organizationId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req.cookies?.['token'] as string | undefined);

    if (!token) {
      throw new AuthenticationError('Authentication required');
    }

    const secret = process.env.JWT_SECRET || 'brandvoice-dev-jwt-secret';
    const decoded = jwt.verify(token, secret) as { id: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { memberships: true },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.memberships[0]?.organizationId,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Invalid or expired token'));
      return;
    }
    next(error);
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  authenticate(req, res, () => next()).catch(() => next());
}

