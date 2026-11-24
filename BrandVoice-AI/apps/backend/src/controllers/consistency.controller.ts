import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { consistencyService } from '../services/consistency.service';
import { ValidationError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { assertBrandAccess, getOrganizationBrandIds } from '../lib/brandAccess';

export class ConsistencyController {
  /**
   * Evaluate content consistency
   */
  async check(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, brandId, platform } = req.body;
      if (!content || typeof content !== 'string') {
        throw new ValidationError('Content string is required');
      }

      const brand = await this.resolveBrand(req, brandId);

      const guideline = brand?.guidelines[0];

      const report = await consistencyService.evaluate(content, {
        brandName: brand?.name,
        toneOfVoice: guideline?.toneOfVoice || undefined,
        writingPrinciples: guideline?.writingPrinciples || undefined,
        preferredVocabulary: guideline?.preferredVocabulary || undefined,
        prohibitedVocabulary: guideline?.prohibitedVocabulary || undefined,
        platform: platform || undefined,
      });

      if (!brand?.id) {
        throw new ValidationError('Create a brand profile before checking consistency');
      }

      try {
        await prisma.consistencyReport.create({
          data: {
            brandId: brand.id,
            inputContent: content,
            overallScore: report.overallScore,
            toneScore: report.toneScore,
            vocabularyScore: report.vocabularyScore,
            writingStyleScore: report.writingStyleScore,
            sentenceStructureScore: report.sentenceStructureScore,
            issues: report.issues as any,
            suggestions: report.suggestions,
          },
        });
      } catch (e) {
        // Non-fatal: don't fail the request if DB save fails
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List past consistency reports
   */
  async history(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { brandId, limit = 20 } = req.query;
      const brandIds = await getOrganizationBrandIds(req.user?.organizationId);
      if (brandId) {
        await assertBrandAccess(req.user?.organizationId, String(brandId));
      }
      const where: any = brandId
        ? { brandId: String(brandId) }
        : { brandId: { in: brandIds.length ? brandIds : ['__none__'] } };

      const reports = await prisma.consistencyReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        select: {
          id: true,
          brandId: true,
          contentId: true,
          overallScore: true,
          toneScore: true,
          vocabularyScore: true,
          writingStyleScore: true,
          sentenceStructureScore: true,
          issues: true,
          suggestions: true,
          inputContent: true,
          createdAt: true,
        },
      });

      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Improve/Rewrite content to resolve consistency issues
   */
  async improve(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, brandId, report } = req.body;
      if (!content) {
        throw new ValidationError('Content is required');
      }

      const brand = await this.resolveBrand(req, brandId);

      const guideline = brand?.guidelines[0];
      const context = {
        brandName: brand?.name,
        toneOfVoice: guideline?.toneOfVoice || undefined,
        writingPrinciples: guideline?.writingPrinciples || undefined,
        preferredVocabulary: guideline?.preferredVocabulary || undefined,
        prohibitedVocabulary: guideline?.prohibitedVocabulary || undefined,
      };

      const evalReport = report || (await consistencyService.evaluate(content, context));
      const improved = await consistencyService.improve(content, context, evalReport);

      res.json({
        success: true,
        data: {
          originalContent: content,
          improvedContent: improved,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private async resolveBrand(req: AuthenticatedRequest, brandId?: string) {
    const brandIds = await getOrganizationBrandIds(req.user?.organizationId);
    const targetId = brandId || brandIds[0];
    if (!targetId) return null;
    await assertBrandAccess(req.user?.organizationId, targetId);
    return prisma.brand.findUnique({
      where: { id: targetId },
      include: { guidelines: true },
    });
  }
}

export const consistencyController = new ConsistencyController();

