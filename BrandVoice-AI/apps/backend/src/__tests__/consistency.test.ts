import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma', () => ({
  prisma: {
    consistencyReport: { create: vi.fn(), findMany: vi.fn() },
    brand: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('../lib/brandAccess', () => ({
  assertBrandAccess: vi.fn().mockResolvedValue(undefined),
  getOrganizationBrandIds: vi.fn().mockResolvedValue(['brand-1']),
}));

vi.mock('../services/consistency.service', () => ({
  consistencyService: {
    evaluate: vi.fn().mockResolvedValue({
      overallScore: 82,
      toneScore: 80,
      vocabularyScore: 85,
      writingStyleScore: 78,
      sentenceStructureScore: 84,
      issues: [{ type: 'tone', message: 'Too casual for brand voice', severity: 'medium' }],
      suggestions: ['Use more formal language'],
    }),
    improve: vi.fn().mockResolvedValue('Improved content text here'),
  },
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '../lib/prisma';
import { ConsistencyController } from '../controllers/consistency.controller';

const consistencyController = new ConsistencyController();

function mockReqRes(body: Record<string, any> = {}, query: Record<string, any> = {}) {
  const req: any = {
    body,
    params: {},
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

describe('ConsistencyController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('check', () => {
    it('rejects when content is missing', async () => {
      const { req, res, next } = mockReqRes({});
      await consistencyController.check(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('evaluates content and saves a report', async () => {
      const brand = {
        id: 'brand-1',
        name: 'TestBrand',
        guidelines: [{
          toneOfVoice: 'Professional',
          writingPrinciples: 'Clear',
          preferredVocabulary: [],
          prohibitedVocabulary: [],
        }],
      };
      vi.mocked(prisma.brand.findUnique).mockResolvedValue(brand as any);
      vi.mocked(prisma.brand.findMany).mockResolvedValue([brand] as any);
      vi.mocked(prisma.consistencyReport.create).mockResolvedValue({} as any);

      const { req, res, next } = mockReqRes({ content: 'Hello world', brandId: 'brand-1' });
      await consistencyController.check(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            overallScore: 82,
            issues: expect.any(Array),
          }),
        })
      );
      expect(prisma.consistencyReport.create).toHaveBeenCalled();
    });
  });

  describe('history', () => {
    it('returns past reports', async () => {
      const reports = [{ id: 'r1', brandId: 'brand-1', overallScore: 82, createdAt: new Date() }];
      vi.mocked(prisma.consistencyReport.findMany).mockResolvedValue(reports as any);

      const { req, res, next } = mockReqRes({}, { limit: '10' });
      await consistencyController.history(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: reports })
      );
    });
  });

  describe('improve', () => {
    it('rejects when content is missing', async () => {
      const { req, res, next } = mockReqRes({});
      await consistencyController.improve(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('returns improved content', async () => {
      const brand = {
        id: 'brand-1', name: 'TestBrand',
        guidelines: [{ toneOfVoice: 'Professional' }],
      };
      vi.mocked(prisma.brand.findUnique).mockResolvedValue(brand as any);
      vi.mocked(prisma.brand.findMany).mockResolvedValue([brand] as any);

      const { req, res, next } = mockReqRes({ content: 'Original draft', brandId: 'brand-1' });
      await consistencyController.improve(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            originalContent: 'Original draft',
            improvedContent: 'Improved content text here',
          }),
        })
      );
    });
  });
});
