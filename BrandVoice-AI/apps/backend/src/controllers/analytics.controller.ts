import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { assertBrandAccess, getOrganizationBrandIds } from '../lib/brandAccess';

export class AnalyticsController {
  async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user?.organizationId;
      const { brandId } = req.query;
      const brandIds = await this.resolveBrandIds(orgId, brandId ? String(brandId) : undefined);
      if (brandIds.length === 0) {
        res.json({
          success: true,
          data: {
            kpis: {
              totalContent: 0,
              approvedContent: 0,
              rejectedContent: 0,
              avgConsistencyScore: 0,
              activeCampaigns: 0,
              contentThisMonth: 0,
            },
            recentContent: [],
            platformDistribution: [],
          },
        });
        return;
      }

      const contentWhere = { brandId: { in: brandIds } };

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalContent,
        approvedContent,
        rejectedContent,
        avgScoreResult,
        activeCampaigns,
        recentContent,
        platformCounts,
        contentThisMonth,
      ] = await Promise.all([
        prisma.content.count({ where: contentWhere }),
        prisma.content.count({ where: { ...contentWhere, status: 'APPROVED' } }),
        prisma.content.count({ where: { ...contentWhere, status: 'REJECTED' } }),
        prisma.content.aggregate({ where: contentWhere, _avg: { consistencyScore: true } }),
        prisma.campaign.count({
          where: {
            isActive: true,
            ...(orgId ? { organizationId: orgId } : {}),
            ...(brandIds.length ? { brandId: { in: brandIds } } : {}),
          },
        }),
        prisma.content.findMany({
          where: contentWhere,
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            platform: true,
            status: true,
            consistencyScore: true,
            createdAt: true,
          },
        }),
        prisma.content.groupBy({
          by: ['platform'],
          where: contentWhere,
          _count: { platform: true },
        }),
        prisma.content.count({ where: { ...contentWhere, createdAt: { gte: startOfMonth } } }),
      ]);

      const avgConsistencyScore = avgScoreResult._avg.consistencyScore
        ? Math.round(avgScoreResult._avg.consistencyScore)
        : 0;

      res.json({
        success: true,
        data: {
          kpis: {
            totalContent,
            approvedContent,
            rejectedContent,
            avgConsistencyScore,
            activeCampaigns,
            contentThisMonth,
          },
          recentContent: recentContent.map(c => ({
            id: c.id,
            title: c.title || `${c.platform} Post`,
            platform: c.platform,
            status: c.status,
            score: c.consistencyScore ?? 0,
            time: c.createdAt.toISOString(),
          })),
          platformDistribution: platformCounts.map(p => ({
            platform: p.platform,
            count: p._count.platform,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const brandIds = await this.resolveBrandIds(
        req.user?.organizationId,
        req.query.brandId ? String(req.query.brandId) : undefined
      );
      if (brandIds.length === 0) {
        res.json({ success: true, data: { monthly: [], weeklyScores: [], platforms: [] } });
        return;
      }

      const since = new Date();
      since.setMonth(since.getMonth() - 5);
      since.setDate(1);
      since.setHours(0, 0, 0, 0);

      const rows = await prisma.content.findMany({
        where: { brandId: { in: brandIds }, createdAt: { gte: since } },
        select: { createdAt: true, status: true, consistencyScore: true, platform: true },
      });

      const monthKeys: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthKeys.push(`${date.getFullYear()}-${date.getMonth()}`);
      }
      const monthlyMap = new Map(monthKeys.map((key) => [key, { generated: 0, approved: 0, rejected: 0, label: '' }]));
      for (const key of monthKeys) {
        const [year, month] = key.split('-').map(Number);
        monthlyMap.get(key)!.label = new Date(year, month, 1).toLocaleString('en', { month: 'short' });
      }

      const weekMap = new Map<string, { total: number; count: number }>();
      const platformMap = new Map<string, number>();

      for (const row of rows) {
        const key = `${row.createdAt.getFullYear()}-${row.createdAt.getMonth()}`;
        const bucket = monthlyMap.get(key);
        if (bucket) {
          bucket.generated += 1;
          if (row.status === 'APPROVED') bucket.approved += 1;
          if (row.status === 'REJECTED') bucket.rejected += 1;
        }
        platformMap.set(row.platform, (platformMap.get(row.platform) || 0) + 1);
        if (row.consistencyScore != null) {
          const weekStart = new Date(row.createdAt);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekKey = weekStart.toISOString().slice(0, 10);
          const current = weekMap.get(weekKey) || { total: 0, count: 0 };
          current.total += row.consistencyScore;
          current.count += 1;
          weekMap.set(weekKey, current);
        }
      }

      res.json({
        success: true,
        data: {
          monthly: monthKeys.map((key) => {
            const bucket = monthlyMap.get(key)!;
            return { month: bucket.label, generated: bucket.generated, approved: bucket.approved, rejected: bucket.rejected };
          }),
          weeklyScores: Array.from(weekMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([week, value], index) => ({
              week: `Wk${index + 1}`,
              score: Math.round(value.total / value.count),
            })),
          platforms: Array.from(platformMap.entries()).map(([platform, count]) => ({ platform, count })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private async resolveBrandIds(organizationId: string | undefined, brandId?: string): Promise<string[]> {
    if (brandId) {
      await assertBrandAccess(organizationId, brandId);
      return [brandId];
    }
    return getOrganizationBrandIds(organizationId);
  }
}

export const analyticsController = new AnalyticsController();
