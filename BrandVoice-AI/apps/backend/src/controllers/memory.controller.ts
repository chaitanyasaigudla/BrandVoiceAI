import { Response, NextFunction } from 'express';
import { embeddingService } from '../services/embedding.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { assertBrandAccess, getOrganizationBrandIds } from '../lib/brandAccess';

export class MemoryController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, limit = 20, brandId } = req.query;
      const brandIds = await this.scopedBrandIds(req, brandId ? String(brandId) : undefined);
      if (brandIds.length === 0) {
        res.json({ success: true, data: [] });
        return;
      }

      const where: any = { brandId: { in: brandIds }, isActive: true };
      if (type && type !== 'all') where.type = String(type);

      const records = await prisma.memoryRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      res.json({
        success: true,
        data: records.map((record) => ({
          id: record.id,
          brandId: record.brandId,
          type: record.type,
          content: record.content,
          platform: record.platform,
          createdAt: record.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  async search(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, brandId, limit = 8 } = req.body;
      if (!query || !String(query).trim()) throw new ValidationError('Query is required');

      const brandIds = await this.scopedBrandIds(req, brandId);
      const results = [];
      for (const id of brandIds) {
        const hits = await embeddingService.searchSimilar(id, String(query), Number(limit));
        results.push(...hits);
      }

      results.sort((a, b) => b.similarity - a.similarity);
      res.json({ success: true, data: results.slice(0, Number(limit)) });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, type = 'approved', brandId, platform } = req.body;
      if (!content) throw new ValidationError('Content is required');

      const brandIds = await getOrganizationBrandIds(req.user?.organizationId);
      const targetBrandId = brandId || brandIds[0];
      if (!targetBrandId) throw new ValidationError('A brand is required before saving memory');
      await assertBrandAccess(req.user?.organizationId, targetBrandId);

      const id = await embeddingService.saveMemory(targetBrandId, String(content), String(type), platform);
      res.status(201).json({ success: true, data: { id }, message: 'Memory recorded successfully' });
    } catch (error) {
      next(error);
    }
  }

  private async scopedBrandIds(req: AuthenticatedRequest, brandId?: string): Promise<string[]> {
    if (brandId) {
      await assertBrandAccess(req.user?.organizationId, brandId);
      return [brandId];
    }
    return getOrganizationBrandIds(req.user?.organizationId);
  }
}

export const memoryController = new MemoryController();
