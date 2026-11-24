import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma', () => ({
  prisma: {
    content: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    contentVersion: { create: vi.fn(), count: vi.fn() },
    contentFeedback: { create: vi.fn() },
    consistencyReport: { create: vi.fn() },
    brand: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('../lib/brandAccess', () => ({
  assertBrandAccess: vi.fn().mockResolvedValue(undefined),
  getOrganizationBrandIds: vi.fn().mockResolvedValue(['brand-1']),
}));

vi.mock('../services/embedding.service', () => ({
  embeddingService: { saveMemory: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../services/langgraph.service', () => ({
  langGraphService: {
    generateContent: vi.fn().mockResolvedValue({
      output: {
        content: 'Generated content text',
        headline: 'Headline',
        mainCaption: 'Caption',
        keyBenefits: ['Benefit 1'],
        cta: 'Click here',
        hashtags: ['#brand'],
        structured: {},
        variations: [],
        provider: 'GROQ',
        model: 'llama-3.3-70b',
        tokensUsed: 250,
      },
      report: {
        overallScore: 85,
        toneScore: 80,
        vocabularyScore: 90,
        writingStyleScore: 85,
        sentenceStructureScore: 82,
        issues: [],
        suggestions: [],
      },
      memoriesUsed: 0,
      stage: 'evaluate',
    }),
  },
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '../lib/prisma';
import { getOrganizationBrandIds } from '../lib/brandAccess';
import { ContentController } from '../controllers/content.controller';

const contentController = new ContentController();

function mockReqRes(
  body: Record<string, any> = {},
  params: Record<string, any> = {},
  query: Record<string, any> = {}
) {
  const req: any = {
    body,
    params,
    query,
    user: { id: 'u1', email: 'test@test.com', name: 'Test', organizationId: 'org1' },
  };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('ContentController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mock return value after clearAllMocks
    vi.mocked(getOrganizationBrandIds).mockResolvedValue(['brand-1']);
  });

  describe('list', () => {
    it('returns paginated content', async () => {
      const items = [{ id: 'c1', title: 'Test', content: 'Body', brandId: 'brand-1' }];
      vi.mocked(prisma.content.findMany).mockResolvedValue(items as any);
      vi.mocked(prisma.content.count).mockResolvedValue(1);

      const { req, res, next } = mockReqRes({}, {}, { limit: '10', page: '1' });
      await contentController.list(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ items, total: 1, page: 1 }),
        })
      );
    });

    it('returns empty when no brands exist', async () => {
      vi.mocked(getOrganizationBrandIds).mockResolvedValueOnce([]);

      const { req, res, next } = mockReqRes({}, {}, {});
      await contentController.list(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ items: [], total: 0 }),
        })
      );
    });
  });

  describe('getById', () => {
    it('returns content with includes', async () => {
      const content = {
        id: 'c1', title: 'Test', content: 'Body', brandId: 'brand-1',
        consistencyReports: [], versions: [],
      };
      vi.mocked(prisma.content.findUnique).mockResolvedValue(content as any);

      const { req, res, next } = mockReqRes({}, { id: 'c1' });
      await contentController.getById(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: content })
      );
    });

    it('returns 404 for missing content', async () => {
      vi.mocked(prisma.content.findUnique).mockResolvedValue(null);
      const { req, res, next } = mockReqRes({}, { id: 'missing' });
      await contentController.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('update', () => {
    it('creates a version and updates the content', async () => {
      const existing = { id: 'c1', content: 'Old text', title: 'Old', brandId: 'brand-1' };
      vi.mocked(prisma.content.findUnique).mockResolvedValue(existing as any);
      vi.mocked(prisma.contentVersion.count).mockResolvedValue(0);
      vi.mocked(prisma.contentVersion.create).mockResolvedValue({} as any);
      vi.mocked(prisma.content.update).mockResolvedValue({ ...existing, content: 'New text' } as any);

      const { req, res, next } = mockReqRes({ content: 'New text' }, { id: 'c1' });
      await contentController.update(req, res, next);

      expect(prisma.contentVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ contentId: 'c1', version: 1, content: 'Old text' }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ content: 'New text' }),
        })
      );
    });

    it('rejects update without content body', async () => {
      const { req, res, next } = mockReqRes({}, { id: 'c1' });
      await contentController.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('delete', () => {
    it('deletes owned content', async () => {
      vi.mocked(prisma.content.findUnique).mockResolvedValue({ id: 'c1', brandId: 'brand-1' } as any);
      vi.mocked(prisma.content.delete).mockResolvedValue({} as any);

      const { req, res, next } = mockReqRes({}, { id: 'c1' });
      await contentController.delete(req, res, next);

      expect(prisma.content.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('updateStatus', () => {
    it('rejects when status is missing', async () => {
      const { req, res, next } = mockReqRes({}, { id: 'c1' });
      await contentController.updateStatus(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
