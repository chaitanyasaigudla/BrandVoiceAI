import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { ValidationError } from '../middleware/errorHandler';

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.internal',
]);

/** True for loopback, private, link-local, and cloud-metadata addresses. */
export function isBlockedAddress(address: string): boolean {
  const ip = address.replace(/^\[|\]$/g, '').toLowerCase();

  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
  if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  if (ip.startsWith('::ffff:')) return isBlockedAddress(ip.slice(7));

  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (!host || BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) return true;
  if (isIP(host) && isBlockedAddress(host)) return true;
  return false;
}

/** Parse an http(s) URL and reject obvious SSRF targets before any network call. */
export function assertSafePublicUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new ValidationError('A valid http or https URL is required');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ValidationError('Only http and https URLs can be crawled');
  }
  if (parsed.username || parsed.password) {
    throw new ValidationError('URLs with embedded credentials are not allowed');
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new ValidationError('That URL points to a private or local address and cannot be crawled');
  }
  return parsed;
}

/** Resolve the hostname and reject it if any address is private. */
export async function assertResolvedPublicUrl(raw: string): Promise<URL> {
  const parsed = assertSafePublicUrl(raw);
  if (isIP(parsed.hostname)) return parsed;

  try {
    const records = await lookup(parsed.hostname, { all: true, verbatim: true });
    if (records.some((record) => isBlockedAddress(record.address))) {
      throw new ValidationError('That URL resolves to a private or local address and cannot be crawled');
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('Could not resolve the website hostname');
  }

  return parsed;
}
