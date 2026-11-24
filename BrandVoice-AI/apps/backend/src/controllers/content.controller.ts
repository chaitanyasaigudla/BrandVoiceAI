import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { embeddingService } from '../services/embedding.service';
import { langGraphService } from '../services/langgraph.service';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { assertBrandAccess, getOrganizationBrandIds } from '../lib/brandAccess';

export class ContentController {
  /**
   * Generate content using Groq/Gemini with brand consistency scoring
   */
  async generate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        brandId,
        platform = 'INSTAGRAM',
        contentType = 'POST',
        topic,
        productDescription,
        campaign,
        audience,
        keywords,
        cta,
        instructions,
        tone = 'Professional',
      } = req.body;

      if (!topic || !topic.trim()) {
        throw new ValidationError('Topic / Product is required');
      }

      const brandIds = await getOrganizationBrandIds(req.user?.organizationId);
      const targetBrandId = brandId || brandIds[0];
      if (!targetBrandId) {
        throw new ValidationError('Create a brand profile before generating content');
      }
      await assertBrandAccess(req.user?.organizationId, targetBrandId);

      const brand = await prisma.brand.findUnique({
        where: { id: targetBrandId },
        include: { guidelines: true, preferences: true },
      });
      if (!brand) throw new NotFoundError('Brand');

      const guideline = brand.guidelines[0];
      const startTime = Date.now();

      const workflow = await langGraphService.generateContent(
        {
          platform,
          tone,
          topic: topic.trim(),
          productDescription: productDescription ? String(productDescription).trim() : undefined,
          campaign,
          audience,
          keywords,
          cta,
          instructions,
          brandId: brand.id,
          brandName: brand.name,
          brandIdentity: guideline?.identity || brand.description || undefined,
          toneOfVoice: guideline?.toneOfVoice || undefined,
          preferredVocabulary: guideline?.preferredVocabulary || undefined,
          prohibitedVocabulary: guideline?.prohibitedVocabulary || undefined,
          writingPrinciples: guideline?.writingPrinciples || undefined,
        },
        {
          brandName: brand.name,
          toneOfVoice: guideline?.toneOfVoice || undefined,
          writingPrinciples: guideline?.writingPrinciples || undefined,
          preferredVocabulary: guideline?.preferredVocabulary || undefined,
          prohibitedVocabulary: guideline?.prohibitedVocabulary || undefined,
          platform,
        }
      );
      const aiResult = workflow.output;
      const consistencyReport = workflow.report;

      const latencyMs = Date.now() - startTime;

      // Save content record in database
      const contentRecord = await prisma.content.create({
        data: {
          brandId: brand.id,
          platform: platform as any,
          contentType: contentType as any,
          title: topic ? String(topic).trim().slice(0, 100) : `${platform} Copy`,
          content: aiResult.content,
          status: 'GENERATED',
          consistencyScore: consistencyReport.overallScore,
          metadata: {
            headline: aiResult.headline,
            mainCaption: aiResult.mainCaption,
            keyBenefits: aiResult.keyBenefits,
            cta: aiResult.cta,
            hashtags: aiResult.hashtags,
            variations: aiResult.variations,
            provider: aiResult.provider,
            model: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            latencyMs,
            memoriesUsed: workflow.memoriesUsed,
            workflowStage: workflow.stage,
            issues: consistencyReport.issues,
            suggestions: consistencyReport.suggestions,
          },
        },
      });

      // Create consistency report record in DB
      await prisma.consistencyReport.create({
        data: {
          contentId: contentRecord.id,
          brandId: brand.id,
          inputContent: aiResult.content,
          overallScore: consistencyReport.overallScore,
          toneScore: consistencyReport.toneScore,
          vocabularyScore: consistencyReport.vocabularyScore,
          writingStyleScore: consistencyReport.writingStyleScore,
          sentenceStructureScore: consistencyReport.sentenceStructureScore,
          issues: consistencyReport.issues as any,
          suggestions: consistencyReport.suggestions,
        },
      });

      embeddingService.saveMemory(brand.id, aiResult.content, 'generated', platform).catch((e) =>
        logger.warn('Embedding background save skipped:', e.message)
      );

      res.status(201).json({
        success: true,
        data: {
          id: contentRecord.id,
          content: aiResult.content,
          headline: aiResult.headline,
          mainCaption: aiResult.mainCaption,
          keyBenefits: aiResult.keyBenefits,
          cta: aiResult.cta,
          hashtags: aiResult.hashtags,
          structured: aiResult.structured,
          variations: aiResult.variations,
          consistencyScore: consistencyReport.overallScore,
          consistencyReport,
          metadata: {
            platform,
            contentType,
            provider: aiResult.provider,
            model: aiResult.model,
            tokensUsed: aiResult.tokensUsed,
            latencyMs,
            memoriesUsed: workflow.memoriesUsed,
            workflowStage: workflow.stage,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all generated content
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { platform, status, search, limit = 50, page = 1 } = req.query;
      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const orgId = req.user?.organizationId;
      const brandIds = await getOrganizationBrandIds(orgId);
      if (brandIds.length === 0) {
        res.json({ success: true, data: { items: [], total: 0, page: Number(page), pageSize: take, totalPages: 0 } });
        return;
      }

      const where: any = { brandId: { in: brandIds } };
      if (req.query.brandId) {
        const requested = String(req.query.brandId);
        await assertBrandAccess(orgId, requested);
        where.brandId = requested;
      }

      if (platform && platform !== 'All') where.platform = platform;
      if (status && status !== 'All') where.status = status;
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { content: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.content.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        prisma.content.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          items,
          total,
          page: Number(page),
          pageSize: take,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single content item by ID
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const content = await this.ownedContent(req, req.params.id, { consistencyReports: true, versions: true });

      res.json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update content status (APPROVED, REJECTED, ARCHIVED)
   */
  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      if (!status) throw new ValidationError('Status is required');

      const existing = await this.ownedContent(req, id);
      const updated = await prisma.content.update({
        where: { id },
        data: { status },
      });

      if (status === 'APPROVED' || status === 'REJECTED') {
        const memoryType = status === 'APPROVED' ? 'approved' : 'rejected';
        const memoryText = reason
          ? `${updated.content}\n\nFeedback: ${String(reason)}`
          : updated.content;
        embeddingService.saveMemory(updated.brandId, memoryText, memoryType, updated.platform).catch(() => {});
        if (req.user) {
          await prisma.contentFeedback.create({
            data: {
              contentId: id,
              userId: req.user.id,
              type: status === 'APPROVED' ? 'approval' : 'rejection',
              feedback: reason ? String(reason) : null,
              originalContent: existing.content,
            },
          });
        }
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update content text (creates a version record)
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { content: newContent, title } = req.body;
      if (!newContent) throw new ValidationError('Content is required');

      const existing = await this.ownedContent(req, id);

      // Create version record of the old content
      const versionCount = await prisma.contentVersion.count({ where: { contentId: id } });
      await prisma.contentVersion.create({
        data: {
          contentId: id,
          version: versionCount + 1,
          content: existing.content,
          changeReason: 'Manual edit',
          changedBy: req.user?.id || 'unknown',
          origin: 'manual',
        },
      });

      const updated = await prisma.content.update({
        where: { id },
        data: {
          content: newContent,
          title: title || existing.title,
          status: 'DRAFT',
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete content item
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.ownedContent(req, id);
      await prisma.content.delete({ where: { id } });
      res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List saved versions for a content item
   */
  async versions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const content = await this.ownedContent(req, req.params.id, { versions: true });
      res.json({ success: true, data: (content as any).versions });
    } catch (error) {
      next(error);
    }
  }

  private async ownedContent(
    req: AuthenticatedRequest,
    id: string,
    include?: { consistencyReports?: boolean; versions?: boolean }
  ) {
    const content = await prisma.content.findUnique({
      where: { id },
      include: include
        ? {
            consistencyReports: include.consistencyReports ? { orderBy: { createdAt: 'desc' } } : false,
            versions: include.versions ? { orderBy: { version: 'desc' } } : false,
          }
        : undefined,
    });
    if (!content) throw new NotFoundError('Content');
    await assertBrandAccess(req.user?.organizationId, content.brandId);
    return content;
  }
}

export const contentController = new ContentController();
