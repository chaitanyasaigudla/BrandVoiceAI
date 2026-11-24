import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api';

export interface BrandGuideline {
  id?: string;
  identity?: string;
  mission?: string;
  values?: string;
  personality?: string;
  toneOfVoice?: string;
  writingPrinciples?: string;
  preferredVocabulary?: string[];
  prohibitedVocabulary?: string[];
  isApproved?: boolean;
}

export interface BrandPreference {
  id?: string;
  professional?: number;
  friendly?: number;
  innovative?: number;
  simple?: number;
  persuasive?: number;
  emotional?: number;
}

export interface Brand {
  id: string;
  name: string;
  websiteUrl?: string;
  industry?: string;
  description?: string;
  targetAudience?: string;
  logoUrl?: string;
  isActive?: boolean;
  guidelines?: BrandGuideline[];
  preferences?: BrandPreference[];
  createdAt?: string;
}

interface BrandContextType {
  brands: Brand[];
  activeBrand: Brand | null;
  activeBrandId: string;
  isLoading: boolean;
  setActiveBrandId: (id: string) => void;
  switchBrand: (id: string) => void;
  refreshBrands: () => Promise<void>;
  createBrand: (data: { name: string; websiteUrl?: string; industry?: string; description?: string }) => Promise<Brand>;
  updateBrandGuidelines: (brandId: string, guidelines: Partial<BrandGuideline>) => Promise<void>;
  updateBrandPreferences: (brandId: string, preferences: Partial<BrandPreference>) => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const STORAGE_KEY = 'brandvoice_active_brand_id';

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrandId, setActiveBrandIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBrands = async () => {
    const token = localStorage.getItem('brandvoice-token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data: any = await apiGet('/brands');
      if (Array.isArray(data) && data.length > 0) {
        setBrands(data);
        const storedId = localStorage.getItem(STORAGE_KEY);
        const found = data.find((b: Brand) => b.id === storedId);
        if (found) {
          setActiveBrandIdState(found.id);
        } else {
          setActiveBrandIdState(data[0].id);
          localStorage.setItem(STORAGE_KEY, data[0].id);
        }
      } else {
        const current: any = await apiGet('/brands/current');
        if (current) {
          setBrands([current]);
          setActiveBrandIdState(current.id);
          localStorage.setItem(STORAGE_KEY, current.id);
        }
      }
    } catch (e: any) {
      console.warn('Could not fetch brands list:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    const handleAuthChange = () => fetchBrands();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const switchBrand = (id: string) => {
    setActiveBrandIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const createBrand = async (data: { name: string; websiteUrl?: string; industry?: string; description?: string }) => {
    const res: any = await apiPost('/brands', data);
    await fetchBrands();
    if (res && res.id) {
      switchBrand(res.id);
    }
    return res;
  };

  const updateBrandGuidelines = async (brandId: string, guidelines: Partial<BrandGuideline>) => {
    await apiPut(`/brands/${brandId}/guidelines`, guidelines);
    await fetchBrands();
  };

  const updateBrandPreferences = async (brandId: string, preferences: Partial<BrandPreference>) => {
    await apiPut(`/brands/${brandId}/preferences`, preferences);
    await fetchBrands();
  };

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0] || null;

  return (
    <BrandContext.Provider
      value={{
        brands,
        activeBrand,
        activeBrandId,
        isLoading,
        setActiveBrandId: switchBrand,
        switchBrand,
        refreshBrands: fetchBrands,
        createBrand,
        updateBrandGuidelines,
        updateBrandPreferences,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextType {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return ctx;
}

