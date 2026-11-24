import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { ValidationError, AuthenticationError, ConflictError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { validatePassword } from '../lib/password';

const JWT_SECRET = process.env.JWT_SECRET || 'brandvoice-dev-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthController {
  /**
   * Register a new user + create default Organization and Brand
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, organizationName } = req.body;

      if (!name || !email || !password) {
        throw new ValidationError('Name, email, and password are required');
      }
      const passwordError = validatePassword(password);
      if (passwordError) throw new ValidationError(passwordError);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictError('A user with this email already exists');
      }

      const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
      const orgName = organizationName || `${name}'s Organization`;
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

      // Create user, organization, membership, and brand in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
          },
        });

        const organization = await tx.organization.create({
          data: {
            name: orgName,
            slug,
          },
        });

        await tx.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'OWNER',
          },
        });

        const brand = await tx.brand.create({
          data: {
            name: orgName,
            organizationId: organization.id,
            description: 'Default brand profile',
          },
        });

        await tx.brandGuideline.create({
          data: {
            brandId: brand.id,
            identity: `${orgName} is an innovative company focused on high-quality solutions.`,
            toneOfVoice: 'Professional, approachable, and value-driven.',
            writingPrinciples: 'Lead with value. Punchy active voice. Keep sentences clear.',
            preferredVocabulary: ['empower', 'streamline', 'intelligent', 'scale', 'seamless'],
            prohibitedVocabulary: ['cheap', 'basic', 'obviously', 'just', 'simply'],
            isApproved: true,
          },
        });

        await tx.brandPreference.create({
          data: {
            brandId: brand.id,
            professional: 65,
            friendly: 70,
            innovative: 60,
            simple: 55,
            persuasive: 75,
            emotional: 45,
          },
        });

        return { user, organization, brand };
      });

      const token = jwt.sign({ id: result.user.id, email: result.user.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as any,
      });

      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
          },
          organization: result.organization,
          brand: result.brand,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user with email and password
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: {
              organization: {
                include: { brands: true },
              },
            },
          },
        },
      });

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new AuthenticationError('Invalid email or password');
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as any,
      });

      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

      const primaryOrg = user.memberships[0]?.organization;
      const primaryBrand = primaryOrg?.brands[0];

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          organization: primaryOrg,
          brand: primaryBrand,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log out user by clearing cookie
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('token');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }


  /**
   * Get current authenticated user session
   */
  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          memberships: {
            include: {
              organization: {
                include: { brands: true },
              },
            },
          },
        },
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          memberships: user.memberships,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const { name, email } = req.body;
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name ? String(name).trim() : undefined,
          email: email ? String(email).trim() : undefined,
        },
      });
      res.json({
        success: true,
        data: { id: updated.id, name: updated.name, email: updated.email },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError();
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw new ValidationError('Current and new password are required');
      }
      const passwordError = validatePassword(newPassword);
      if (passwordError) throw new ValidationError(passwordError);

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) throw new AuthenticationError();

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new ValidationError('Current password is incorrect');
      }

      const newHash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS || 12));
      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash: newHash },
      });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update organization info
   */
  async updateOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) throw new ValidationError('No active organization found');

      const { name } = req.body;
      const updated = await prisma.organization.update({
        where: { id: orgId },
        data: {
          name: name ? String(name).trim() : undefined,
        },
      });

      res.json({ success: true, data: updated, message: 'Organization updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

