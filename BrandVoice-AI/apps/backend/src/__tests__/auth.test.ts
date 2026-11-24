import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock factories are hoisted – no external variable references allowed

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: { create: vi.fn() },
    organizationMember: { create: vi.fn() },
    brand: { create: vi.fn() },
    brandGuideline: { create: vi.fn() },
    brandPreference: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi.fn(),
    JsonWebTokenError: class extends Error {},
    TokenExpiredError: class extends Error {},
  },
}));

import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AuthController } from '../controllers/auth.controller';

const authController = new AuthController();

function mockReqRes(body: Record<string, any> = {}, user?: any) {
  const req: any = { body, user, headers: {}, cookies: {} };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('AuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('rejects when required fields are missing', async () => {
      const { req, res, next } = mockReqRes({ name: '', email: '', password: '' });
      await authController.register(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('rejects a weak password', async () => {
      const { req, res, next } = mockReqRes({ name: 'Test', email: 'a@b.com', password: 'short' });
      await authController.register(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('rejects a duplicate email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'exists' } as any);
      const { req, res, next } = mockReqRes({ name: 'Test', email: 'dup@test.com', password: 'ValidPass1' });
      await authController.register(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    });

    it('registers a valid user and returns 201 with token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => {
        return {
          user: { id: 'u1', email: 'new@test.com', name: 'New User' },
          organization: { id: 'o1', name: "New User's Organization", slug: 'new-org-abcd' },
          brand: { id: 'b1', name: "New User's Organization", organizationId: 'o1' },
        };
      });

      const { req, res, next } = mockReqRes({
        name: 'New User',
        email: 'new@test.com',
        password: 'ValidPass1',
      });
      await authController.register(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'mock-jwt-token',
            user: expect.objectContaining({ email: 'new@test.com' }),
          }),
        })
      );
    });
  });

  // ─── Login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('rejects when email or password missing', async () => {
      const { req, res, next } = mockReqRes({ email: '' });
      await authController.login(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('rejects an unknown email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      const { req, res, next } = mockReqRes({ email: 'no@user.com', password: 'any' });
      await authController.login(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('rejects incorrect password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1', email: 'test@test.com', name: 'Test',
        passwordHash: '$2a$12$hash', memberships: [],
      } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
      const { req, res, next } = mockReqRes({ email: 'test@test.com', password: 'wrong' });
      await authController.login(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('returns token on correct credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1', email: 'test@test.com', name: 'Test User',
        passwordHash: '$2a$12$hash',
        memberships: [{ organization: { id: 'o1', brands: [{ id: 'b1' }] } }],
      } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      const { req, res, next } = mockReqRes({ email: 'test@test.com', password: 'ValidPass1' });
      await authController.login(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: 'mock-jwt-token' }),
        })
      );
    });
  });

  // ─── Logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears the cookie and returns success', async () => {
      const { req, res, next } = mockReqRes();
      await authController.logout(req, res, next);
      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
