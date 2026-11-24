import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { crawlerService } from '../services/crawler.service';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class BrandController {
  /**
   * Get current or first brand for the organization
   */
  async getCurrentBrand(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user?.organizationId;
      let brand = await prisma.brand.findFirst({
        where: orgId ? { organizationId: orgId } : {},
        include: {
          guidelines: true,
          preferences: true,
          vocabularies: true,
        },
      });

      // If no brand exists for this organization yet, create default one
      if (!brand) {
        let org = orgId ? await prisma.organization.findUnique({ where: { id: orgId } }) : null;
        if (!org) {
          org = await prisma.organization.findFirst();
        }
        if (!org) {
          org = await prisma.organization.create({
            data: { name: 'My Brand', slug: 'my-brand' },
          });
        }
        brand = await prisma.brand.create({
          data: {
            name: org.name || 'My Brand',
            websiteUrl: 'https://example.com',
            industry: 'General Business & Marketing',
            description: `${org.name || 'My Brand'} multi-channel marketing and brand voice profile.`,
            organizationId: org.id,
            guidelines: {
              create: {
                identity: `${org.name || 'My Brand'} is focused on delivering exceptional customer value.`,
                toneOfVoice: 'Professional, approachable, authentic, and customer-focused.',
                writingPrinciples: 'Lead with value. Keep sentences concise (15–25 words). Avoid empty buzzwords.',
                preferredVocabulary: ['empower', 'streamline', 'scale', 'intelligent', 'seamless', 'quality'],
                prohibitedVocabulary: ['cheap', 'basic', 'obviously', 'just', 'simply'],
                isApproved: true,
              },
            },
            preferences: {
              create: {
                professional: 65,
                friendly: 70,
                innovative: 58,
                simple: 55,
                persuasive: 72,
                emotional: 45,
              },
            },
          },
          include: {
            guidelines: true,
            preferences: true,
            vocabularies: true,
          },
        });
      }

      res.json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crawl a website using Firecrawl and extract brand voice guidelines
   */
  async crawlWebsite(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url, brandId } = req.body;
      if (!url) {
        throw new ValidationError('Website URL is required');
      }

      // If brandId is not provided, use current brand
      let targetBrandId = brandId;
      if (!targetBrandId) {
        const currentBrand = await prisma.brand.findFirst();
        targetBrandId = currentBrand?.id;
      }

      const crawlResult = await crawlerService.crawlAndExtract(url, targetBrandId);

      res.json({
        success: true,
        data: crawlResult,
        message: 'Website crawled and brand guidelines extracted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update brand guidelines
   */
  async updateGuidelines(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { identity, toneOfVoice, writingPrinciples, preferredVocabulary, prohibitedVocabulary, isApproved } = req.body;

      const brand = await prisma.brand.findUnique({ where: { id } });
      if (!brand) throw new NotFoundError('Brand');

      const guideline = await prisma.brandGuideline.findFirst({ where: { brandId: id } });

      const updated = guideline
        ? await prisma.brandGuideline.update({
            where: { id: guideline.id },
            data: {
              identity,
              toneOfVoice,
              writingPrinciples,
              preferredVocabulary: preferredVocabulary || undefined,
              prohibitedVocabulary: prohibitedVocabulary || undefined,
              isApproved: isApproved !== undefined ? isApproved : undefined,
            },
          })
        : await prisma.brandGuideline.create({
            data: {
              brandId: id,
              identity,
              toneOfVoice,
              writingPrinciples,
              preferredVocabulary: preferredVocabulary || [],
              prohibitedVocabulary: prohibitedVocabulary || [],
              isApproved: isApproved !== undefined ? isApproved : true,
            },
          });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update brand voice sliders
   */
  async updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { professional, friendly, innovative, simple, persuasive, emotional } = req.body;

      const updated = await prisma.brandPreference.upsert({
        where: { brandId: id },
        create: {
          brandId: id,
          professional: professional ?? 50,
          friendly: friendly ?? 50,
          innovative: innovative ?? 50,
          simple: simple ?? 50,
          persuasive: persuasive ?? 50,
          emotional: emotional ?? 50,
        },
        update: {
          professional,
          friendly,
          innovative,
          simple,
          persuasive,
          emotional,
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all brands
   */
  async listBrands(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user?.organizationId;
      const whereClause = orgId ? { organizationId: orgId } : {};
      const brands = await prisma.brand.findMany({
        where: whereClause,
        include: {
          guidelines: true,
          preferences: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({
        success: true,
        data: brands,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new brand
   */
  async createBrand(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        websiteUrl,
        industry,
        description,
        targetAudience,
        toneOfVoice,
        writingPrinciples,
        preferredVocabulary,
        prohibitedVocabulary,
      } = req.body;

      if (!name) throw new ValidationError('Brand name is required');

      let orgId = req.user?.organizationId;
      if (!orgId) {
        const org = await prisma.organization.findFirst();
        orgId = org?.id;
      }
      if (!orgId) {
        const createdOrg = await prisma.organization.create({
          data: {
            name: `${name} Workspace`,
            slug: `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
          },
        });
        orgId = createdOrg.id;
      }

      const brand = await prisma.brand.create({
        data: {
          name: name.trim(),
          websiteUrl: websiteUrl ? String(websiteUrl).trim() : undefined,
          industry: industry ? String(industry).trim() : 'General',
          description: description ? String(description).trim() : `${name.trim()} brand and marketing identity.`,
          targetAudience: targetAudience ? String(targetAudience).trim() : undefined,
          organizationId: orgId,
          guidelines: {
            create: {
              identity: description || `${name} brand identity`,
              toneOfVoice: toneOfVoice || 'Professional, authentic, value-driven, and clear.',
              writingPrinciples: writingPrinciples || 'Lead with customer value. Keep sentences clear and active. Communicate with confidence.',
              preferredVocabulary: Array.isArray(preferredVocabulary) ? preferredVocabulary : [],
              prohibitedVocabulary: Array.isArray(prohibitedVocabulary) ? prohibitedVocabulary : [],
              isApproved: true,
            },
          },
          preferences: {
            create: {
              professional: 70,
              friendly: 65,
              innovative: 70,
              simple: 70,
              persuasive: 75,
              emotional: 50,
            },
          },
        },
        include: {
          guidelines: true,
          preferences: true,
        },
      });

      res.status(201).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete brand
   */
  async deleteBrand(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const brand = await prisma.brand.findUnique({ where: { id } });
      if (!brand) throw new NotFoundError('Brand');

      await prisma.brand.delete({ where: { id } });
      res.json({
        success: true,
        message: 'Brand removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update brand details (name, websiteUrl, industry, description, etc.)
   */
  async updateBrand(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, websiteUrl, industry, description, targetAudience } = req.body;

      const brand = await prisma.brand.findUnique({ where: { id } });
      if (!brand) throw new NotFoundError('Brand');

      const updated = await prisma.brand.update({
        where: { id },
        data: {
          name: name ?? undefined,
          websiteUrl: websiteUrl ?? undefined,
          industry: industry ?? undefined,
          description: description ?? undefined,
          targetAudience: targetAudience ?? undefined,
        },
        include: {
          guidelines: true,
          preferences: true,
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get brand by ID
   */
  async getBrandById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const brand = await prisma.brand.findUnique({
        where: { id },
        include: {
          guidelines: true,
          preferences: true,
          vocabularies: true,
        },
      });
      if (!brand) throw new NotFoundError('Brand');
      res.json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandController = new BrandController();

