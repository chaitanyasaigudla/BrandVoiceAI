import { prisma } from './prisma';
import { AuthorizationError, NotFoundError } from '../middleware/errorHandler';

export async function getOrganizationBrandIds(organizationId?: string): Promise<string[]> {
  if (!organizationId) return [];
  const brands = await prisma.brand.findMany({
    where: { organizationId },
    select: { id: true },
  });
  return brands.map((brand) => brand.id);
}

export async function assertBrandAccess(organizationId: string | undefined, brandId: string) {
  if (!organizationId) {
    throw new AuthorizationError('No organization is associated with this account');
  }
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId },
  });
  if (!brand) {
    throw new NotFoundError('Brand');
  }
  return brand;
}
