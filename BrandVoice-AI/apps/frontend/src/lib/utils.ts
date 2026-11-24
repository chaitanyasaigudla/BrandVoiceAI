import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date to locale string */
export function formatDate(date: string | Date | undefined | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
      ...options,
    }).format(d);
  } catch {
    return '—';
  }
}

/** Format relative time */
export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return 'just now';
  try {
    const now  = new Date();
    const then = new Date(date);
    if (isNaN(then.getTime())) return 'recently';
    const diff = now.getTime() - then.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours   = Math.floor(diff / 3600000);
    const days    = Math.floor(diff / 86400000);

    if (minutes < 1)  return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours   < 24) return `${hours}h ago`;
    if (days    < 7)  return `${days}d ago`;
    return formatDate(date);
  } catch {
    return 'recently';
  }
}

/** Truncate text */
export function truncate(text: string, length = 100): string {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

/** Get score color class */
export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-success-500';
  if (score >= 70) return 'text-blue-500';
  if (score >= 50) return 'text-warning-500';
  return 'text-danger-500';
}

/** Get score label */
export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Work';
}

/** Get status badge color */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    APPROVED:   'bg-success-50 text-success-600 border-success-500/20',
    REJECTED:   'bg-danger-50 text-danger-600 border-danger-500/20',
    DRAFT:      'bg-muted text-muted-foreground border-border',
    GENERATED:  'bg-blue-50 text-blue-600 border-blue-500/20',
    IN_REVIEW:  'bg-warning-50 text-warning-600 border-warning-500/20',
    ARCHIVED:   'bg-muted/50 text-muted-foreground/60 border-border',
  };
  return map[status] ?? 'bg-muted text-muted-foreground border-border';
}

/** Platform display names */
export const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  LINKEDIN:  'LinkedIn',
  FACEBOOK:  'Facebook',
  TWITTER:   'X (Twitter)',
  BLOG:      'Blog',
  EMAIL:     'Email',
  ECOMMERCE: 'E-commerce',
};

/** Content type display names */
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  CAPTION:             'Caption',
  POST:                'Post',
  ARTICLE:             'Article',
  EMAIL:               'Email',
  PRODUCT_DESCRIPTION: 'Product Description',
  REWRITE:             'Rewrite',
};

/** Format number with K/M suffix */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Debounce */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
