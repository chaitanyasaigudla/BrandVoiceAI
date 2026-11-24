import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

export class CampaignController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await prisma.campaign.findMany({
        include: { _count: { select: { content: true } } },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: campaigns.map(c => ({
          id: c.id,
          name: c.name,
          objective: c.objective,
          targetAudience: c.targetAudience,
          status: c.isActive ? 'ACTIVE' : 'ARCHIVED',
          contentCount: c._count.content,
          startDate: c.startDate?.toISOString(),
          endDate: c.endDate?.toISOString(),
          createdAt: c.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, objective, targetAudience, brandId } = req.body;
      if (!name) throw new ValidationError('Campaign name is required');

      let targetBrand = brandId ? await prisma.brand.findUnique({ where: { id: brandId } }) : await prisma.brand.findFirst();
      if (!targetBrand) {
        const org = await prisma.organization.findFirst() || await prisma.organization.create({ data: { name: 'Acme', slug: 'acme' } });
        targetBrand = await prisma.brand.create({ data: { name: 'Acme', organizationId: org.id } });
      }

      const campaign = await prisma.campaign.create({
        data: {
          name,
          objective,
          targetAudience,
          brandId: targetBrand.id,
          organizationId: targetBrand.organizationId,
        },
      });

      res.status(201).json({ success: true, data: campaign });
    } catch (error) {
      next(error);
    }
  }
}

export const campaignController = new CampaignController();
