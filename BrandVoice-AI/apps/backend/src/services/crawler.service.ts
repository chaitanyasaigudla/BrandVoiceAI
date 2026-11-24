import { aiService } from './ai.service';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { assertResolvedPublicUrl } from '../lib/urlSafety';

export interface CrawlResult {
  url: string;
  title: string;
  pagesCrawled: number;
  wordsExtracted: number;
  extractedBrandInfo: {
    brandName?: string;
    industry?: string;
    description?: string;
    targetAudience?: string;
    mission?: string;
    values?: string;
    toneOfVoice?: string;
    writingPrinciples?: string;
    preferredVocabulary?: string[];
    prohibitedVocabulary?: string[];
  };
}

export class CrawlerService {
  private firecrawlApiKey: string;

  constructor() {
    this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY || '';
  }

  /**
   * Scrape a brand website using Firecrawl and extract brand voice guidelines
   */
  async crawlAndExtract(url: string, brandId?: string): Promise<CrawlResult> {
    if (!this.firecrawlApiKey || this.firecrawlApiKey.startsWith('your-')) {
      throw new Error('Firecrawl API key is not configured');
    }

    const safeUrl = await assertResolvedPublicUrl(url);
    const target = safeUrl.toString();
    logger.info(`Starting website crawl for URL: ${target}`);

    const response = await this.scrapeWithRetry(target);

    const data: any = await response.json();
    const markdown = data?.data?.markdown || data?.markdown || '';
    const title = data?.data?.metadata?.title || data?.metadata?.title || 'Brand Website';

    const wordsExtracted = markdown.split(/\s+/).filter(Boolean).length;
    logger.info(`Firecrawl scraped successfully: ${wordsExtracted} words extracted`);

    // Use AI to extract comprehensive brand voice signals from markdown
    const extractedBrandInfo = await this.extractBrandVoiceFromContent(markdown, url);

    // Save crawl record in DB if brandId provided
    if (brandId) {
      try {
        await prisma.crawledPage.create({
          data: {
            brandId,
            url: target,
            title,
            rawContent: markdown.slice(0, 50000), // store up to 50k chars
            crawlStatus: 'COMPLETED',
            extractedInfo: extractedBrandInfo as any,
            crawledAt: new Date(),
          },
        });

        // Update brand guidelines with the extracted data
        await prisma.brand.update({
          where: { id: brandId },
          data: {
            name: extractedBrandInfo.brandName || undefined,
            websiteUrl: target,
            industry: extractedBrandInfo.industry,
            description: extractedBrandInfo.description,
            targetAudience: extractedBrandInfo.targetAudience,
          },
        });

        const guidelineData = {
          identity: extractedBrandInfo.description,
          mission: extractedBrandInfo.mission,
          values: extractedBrandInfo.values,
          toneOfVoice: extractedBrandInfo.toneOfVoice,
          writingPrinciples: extractedBrandInfo.writingPrinciples,
          preferredVocabulary: extractedBrandInfo.preferredVocabulary || [],
          prohibitedVocabulary: extractedBrandInfo.prohibitedVocabulary || [],
          isApproved: true,
        };
        const existingGuideline = await prisma.brandGuideline.findFirst({ where: { brandId } });
        if (existingGuideline) {
          await prisma.brandGuideline.update({ where: { id: existingGuideline.id }, data: guidelineData });
        } else {
          await prisma.brandGuideline.create({ data: { brandId, ...guidelineData } });
        }
      } catch (dbErr: any) {
        logger.warn('Could not persist crawl to database:', dbErr.message);
      }
    }

    return {
      url: target,
      title,
      pagesCrawled: 1,
      wordsExtracted,
      extractedBrandInfo,
    };
  }

  private async scrapeWithRetry(url: string): Promise<Response> {
    let lastError = 'Firecrawl request failed';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.firecrawlApiKey}`,
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        if (response.ok) return response;

        const err = await response.text();
        lastError = `Firecrawl returned ${response.status}: ${err.slice(0, 300)}`;
        logger.warn(`Firecrawl attempt ${attempt} failed`, { status: response.status });
        if (response.status < 500 && response.status !== 429) break;
      } catch (error: any) {
        lastError = error.message || lastError;
        logger.warn(`Firecrawl attempt ${attempt} errored`, { error: lastError });
      }

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 700));
      }
    }

    throw new Error(`Failed to crawl URL ${url}: ${lastError}`);
  }

  private async extractBrandVoiceFromContent(markdown: string, url: string): Promise<CrawlResult['extractedBrandInfo']> {
    const sample = markdown.slice(0, 12000); // Send first 12k chars to LLM
    const systemPrompt = `You are an expert brand strategist analyzing a company's website content.
Extract the company's brand voice, identity, and positioning.
Respond ONLY with a valid JSON object with the following fields:
{
  "brandName": "Name of the brand or company",
  "industry": "e.g. SaaS, Fintech, E-commerce, HealthTech",
  "description": "2-3 sentence overview of what the company does and who it serves",
  "targetAudience": "Description of ideal customers/users",
  "mission": "Core mission statement",
  "values": "Key brand values (comma-separated or concise sentence)",
  "toneOfVoice": "Description of tone (e.g. Professional, authoritative yet approachable, innovative)",
  "writingPrinciples": "3 key writing rules observed (e.g. Active voice, data-backed claims, concise)",
  "preferredVocabulary": ["word1", "word2", "word3", "word4", "word5", "word6"],
  "prohibitedVocabulary": ["word1", "word2", "word3", "word4"]
}`;

    const raw = await aiService.completePrompt(
      systemPrompt,
      `Website URL: ${url}\nWebsite Content:\n"""\n${sample}\n"""`,
      0.2
    );

    try {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      logger.warn('Failed to parse brand voice JSON, using fallback extracted fields');
      return {
        brandName: new URL(url).hostname.replace('www.', '').split('.')[0],
        industry: 'Technology / Digital',
        description: 'Modern innovative company focused on delivering customer value.',
        toneOfVoice: 'Professional, forward-thinking, and customer-centric.',
        writingPrinciples: 'Lead with value. Clear and concise messaging.',
        preferredVocabulary: ['empower', 'innovate', 'streamline', 'intelligent', 'scale'],
        prohibitedVocabulary: ['cheap', 'basic', 'just', 'obviously'],
      };
    }
  }
}

export const crawlerService = new CrawlerService();

