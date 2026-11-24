// Shared types and constants for BrandVoice AI

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum ContentPlatform {
  INSTAGRAM = 'INSTAGRAM',
  LINKEDIN = 'LINKEDIN',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  BLOG = 'BLOG',
  EMAIL = 'EMAIL',
  ECOMMERCE = 'ECOMMERCE',
}

export enum ContentType {
  CAPTION = 'CAPTION',
  POST = 'POST',
  ARTICLE = 'ARTICLE',
  EMAIL = 'EMAIL',
  PRODUCT_DESCRIPTION = 'PRODUCT_DESCRIPTION',
  REWRITE = 'REWRITE',
}

export enum AIProvider {
  GROQ = 'GROQ',
  GEMINI = 'GEMINI',
}

export enum CrawlStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// ─── Brand Types ──────────────────────────────────────────────────────────────

export interface BrandProfile {
  id: string;
  name: string;
  websiteUrl?: string;
  industry?: string;
  description?: string;
  targetAudience?: string;
  productsServices?: string;
  logoUrl?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandGuideline {
  id: string;
  brandId: string;
  identity: string;
  mission: string;
  values: string;
  personality: string;
  toneOfVoice: string;
  writingPrinciples: string;
  messagingRules: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandVoiceConfig {
  professional: number; // 0-100 (0=casual, 100=professional)
  friendly: number;     // 0-100 (0=formal, 100=friendly)
  innovative: number;   // 0-100 (0=traditional, 100=innovative)
  simple: number;       // 0-100 (0=technical, 100=simple)
  persuasive: number;   // 0-100 (0=informative, 100=persuasive)
  emotional: number;    // 0-100 (0=rational, 100=emotional)
}

// ─── Content Types ────────────────────────────────────────────────────────────

export interface ContentItem {
  id: string;
  title?: string;
  content: string;
  platform: ContentPlatform;
  contentType: ContentType;
  status: ContentStatus;
  brandId: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
  consistencyScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationRequest {
  brandId: string;
  platform: ContentPlatform;
  contentType: ContentType;
  campaignId?: string;
  inputs: Record<string, string | string[] | boolean | number>;
}

export interface GenerationResult {
  content: string;
  variations: string[];
  metadata: {
    platform: ContentPlatform;
    contentType: ContentType;
    provider: AIProvider;
    tokensUsed: number;
    latencyMs: number;
  };
  consistencyScore?: number;
}

// ─── Consistency Types ────────────────────────────────────────────────────────

export interface ConsistencyReport {
  id: string;
  contentId?: string;
  brandId: string;
  overallScore: number;
  toneScore: number;
  vocabularyScore: number;
  writingStyleScore: number;
  sentenceStructureScore: number;
  issues: ConsistencyIssue[];
  suggestions: string[];
  createdAt: string;
}

export interface ConsistencyIssue {
  type: 'tone' | 'vocabulary' | 'style' | 'structure';
  severity: 'low' | 'medium' | 'high';
  description: string;
  originalText?: string;
  suggestedFix?: string;
}

// ─── Memory Types ─────────────────────────────────────────────────────────────

export interface MemoryRecord {
  id: string;
  brandId: string;
  type: 'approved' | 'rejected' | 'preference' | 'feedback';
  content: string;
  platform?: ContentPlatform;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface EditorialPreference {
  id: string;
  brandId: string;
  preferredTone?: string;
  sentenceLength?: string;
  vocabulary?: string[];
  ctaStyle?: string;
  emojiPolicy?: string;
  writingComplexity?: string;
  formality?: string;
  contentStructure?: string;
  updatedAt: string;
}

// ─── Campaign Types ───────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  objective?: string;
  targetAudience?: string;
  brandId: string;
  organizationId: string;
  startDate?: string;
  endDate?: string;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics Types ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalContent: number;
  approvedContent: number;
  rejectedContent: number;
  avgConsistencyScore: number;
  activeCampaigns: number;
  contentThisMonth: number;
}

export interface ContentByPlatform {
  platform: ContentPlatform;
  count: number;
}

export interface ContentOverTime {
  date: string;
  count: number;
}
