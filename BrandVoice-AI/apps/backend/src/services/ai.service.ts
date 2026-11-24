import { logger } from '../lib/logger';
import { langchainService } from './langchain.service';

export interface GenerationParams {
  platform: string;
  contentType?: string;
  tone?: string;
  topic: string; // The primary subject/product/service
  productDescription?: string; // User-defined description & value proposition
  campaign?: string;
  audience?: string;
  keywords?: string[] | string;
  cta?: string;
  instructions?: string;
  brandId?: string;
  memoryContext?: string;
  brandName?: string;
  brandIdentity?: string;
  toneOfVoice?: string;
  preferredVocabulary?: string[];
  prohibitedVocabulary?: string[];
  writingPrinciples?: string;
}

export interface StructuredContent {
  headline: string;
  mainCaption: string;
  keyBenefits: string[];
  cta: string;
  hashtags: string[];
}

export interface GenerationOutput {
  content: string; // Full formatted copy ready to copy/publish
  structured: StructuredContent;
  headline: string;
  mainCaption: string;
  keyBenefits: string[];
  cta: string;
  hashtags: string[];
  variations: string[];
  provider: 'GROQ' | 'GEMINI';
  model: string;
  tokensUsed: number;
}

export class AIService {
  /**
   * Main generation method. LangChain calls Groq first and falls back to Gemini.
   * Relevance validation retries once when the draft drifts off topic.
   */
  async generate(params: GenerationParams, isRetry = false): Promise<GenerationOutput> {
    const validatedCta = this.getValidatedCta(params.topic, params.cta, params.platform);
    const filteredKeywords = this.filterRelevantKeywords(params.topic, params.keywords);

    const systemPrompt = this.buildSystemPrompt(params, validatedCta, filteredKeywords, isRetry);
    const userPrompt = this.buildUserPrompt(params, validatedCta, filteredKeywords);

    logger.info(`Generating content via LangChain for topic: "${params.topic}" [${params.platform}]`);
    const completion = await langchainService.complete(systemPrompt, userPrompt, isRetry ? 0.3 : 0.6);
    const rawOutput = {
      rawContent: completion.text,
      tokensUsed: completion.tokensUsed,
      provider: completion.provider,
      model: completion.model,
    };

    // Parse structured output
    const parsed = this.parseStructuredOutput(rawOutput.rawContent, params, validatedCta, rawOutput.tokensUsed);

    // Validate relevance
    const relevance = this.validateRelevance(parsed.content, params.topic);
    if (!relevance.isRelevant && !isRetry) {
      logger.warn(`Content relevance validation failed: ${relevance.reason}. Triggering self-correction retry...`);
      return this.generate(params, true);
    }

    return {
      content: parsed.content,
      structured: parsed.structured,
      headline: parsed.structured.headline,
      mainCaption: parsed.structured.mainCaption,
      keyBenefits: parsed.structured.keyBenefits,
      cta: parsed.structured.cta,
      hashtags: parsed.structured.hashtags,
      variations: parsed.variations,
      provider: rawOutput.provider,
      model: rawOutput.model,
      tokensUsed: rawOutput.tokensUsed,
    };
  }

  /**
   * Validate Call to Action based on topic and platform
   */
  getValidatedCta(topic: string, requestedCta?: string, platform?: string): string {
    const lowerTopic = (topic || '').toLowerCase();
    const isFootwearOrApparel = /shoe|sneaker|boot|runner|apparel|clothing|jacket|shirt|wear|fashion|watch|bag|backpack|accessory|coffee|drink|food|snack|product/i.test(lowerTopic);
    const isSaasOrSoftware = /software|saas|platform|api|tool|cloud|automation|workflow|app|dashboard|crm|analytics|b2b/i.test(lowerTopic);

    // If requested CTA exists, check for severe mismatch
    if (requestedCta && requestedCta.trim()) {
      const lowerReq = requestedCta.toLowerCase();
      if (isFootwearOrApparel && (lowerReq.includes('free trial') || lowerReq.includes('demo') || lowerReq.includes('install'))) {
        return 'Shop Now';
      }
      if (isSaasOrSoftware && (lowerReq.includes('fit') || lowerReq.includes('pair'))) {
        return 'Start Free Trial';
      }
      return requestedCta.trim();
    }

    // Smart defaults
    if (isFootwearOrApparel) {
      if (/shoe|sneaker|boot|runner/i.test(lowerTopic)) return 'Find Your Fit';
      return 'Shop Now';
    }
    if (isSaasOrSoftware) {
      return 'Start Free Trial';
    }
    return 'Learn More';
  }

  /**
   * Filter out irrelevant B2B/enterprise software keywords when the product is consumer/physical
   */
  filterRelevantKeywords(topic: string, keywords?: string[] | string): string[] {
    if (!keywords) return [];
    const list = Array.isArray(keywords)
      ? keywords
      : keywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean);

    const lowerTopic = (topic || '').toLowerCase();
    const isPhysicalProduct = /shoe|sneaker|boot|runner|apparel|clothing|fashion|watch|bag|backpack|coffee|food|drink|goods/i.test(lowerTopic);

    return list.filter((kw) => {
      const lowerKw = kw.toLowerCase();
      if (isPhysicalProduct) {
        if (/workflow automation|api integration|enterprise saas|b2b software|operations teams|cloud infrastructure/i.test(lowerKw)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Check if generated content discusses the actual topic without placeholder artifacts
   */
  validateRelevance(content: string, topic: string): { isRelevant: boolean; reason?: string } {
    const lowerContent = content.toLowerCase();
    const lowerTopic = (topic || '').toLowerCase();

    // 1. Check for banned placeholders
    const placeholders = ['example.com', 'placeholder', '[insert', 'lorem ipsum', 'brandvoice.ai/docs', 'documentation page'];
    for (const p of placeholders) {
      if (lowerContent.includes(p)) {
        return { isRelevant: false, reason: `Contains forbidden placeholder: "${p}"` };
      }
    }

    // 2. Check for core topic words
    const words = lowerTopic
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ''))
      .filter((w) => w.length > 2 && !['for', 'the', 'and', 'with', 'our', 'new', 'launch', 'all'].includes(w));

    if (words.length > 0) {
      const mentionsTopic = words.some((w) => lowerContent.includes(w));
      if (!mentionsTopic) {
        return { isRelevant: false, reason: `Does not mention core subject "${topic}"` };
      }
    }

    // 3. Disallow SaaS boilerplate on consumer goods
    if (/shoe|sneaker|boot|runner|apparel|clothing/i.test(lowerTopic)) {
      if (/workflow automation|operations teams eliminate friction|enterprise automation platform/i.test(lowerContent)) {
        return { isRelevant: false, reason: 'Injected enterprise software boilerplate into shoe product copy' };
      }
    }

    return { isRelevant: true };
  }

  private buildSystemPrompt(params: GenerationParams, cta: string, keywords: string[], isRetry = false): string {
    const brandName = params.brandName || 'BrandVoice AI';
    const brandIdentity = params.brandIdentity || 'A leading innovative brand committed to excellence.';
    const toneOfVoice = params.toneOfVoice || 'Professional, engaging, direct, and customer-focused.';
    const writingPrinciples = params.writingPrinciples || 'Lead with value. Keep sentences crisp and punchy. Eliminate corporate fluff.';
    const preferredVocab = params.preferredVocabulary?.length ? params.preferredVocabulary.join(', ') : '';
    const prohibitedVocab = params.prohibitedVocabulary?.length ? params.prohibitedVocabulary.join(', ') : 'cheap, basic, obviously';

    return `You are BrandVoice AI, an elite marketing copywriter and brand director.
You write high-converting, publication-ready marketing copy for global brands.

${isRetry ? '⚠️ CRITICAL CORRECTION: The previous output failed relevance validation. You MUST write strictly and exclusively about "' + params.topic + '". DO NOT discuss software, documentation, or placeholders.' : ''}

CORE PRINCIPLES:
1. TOPIC PRIORITY (ABSOLUTE RULE):
   - The user's Topic / Product is: "${params.topic}".
   - "${params.topic}" IS THE PRIMARY AND EXCLUSIVE SUBJECT of this copy.
   - The brand context (${brandName}) specifies HOW you speak (tone, personality, brand values). It NEVER replaces WHAT product you are selling.
   - If the product is "${params.topic}" (e.g. Shoes), you MUST write about ${params.topic}. NEVER drift into discussing software, automation, platforms, or documentation.

2. ZERO PLACEHOLDERS OR INTERNAL ARTIFACTS:
   - NEVER mention "example.com", "placeholder", "[insert link]", "documentation", or prompt instructions.
   - The copy must be 100% final, professional, and ready to publish immediately.

3. CONTEXT-AWARE CTA:
   - Use the appropriate Call to Action for this product: "${cta}".

4. BRAND VOICE GUIDELINES:
   - Brand: ${brandName}
   - Persona & Identity: ${brandIdentity}
   - Tone of Voice: ${toneOfVoice} (Target Tone Setting: ${params.tone || 'Professional'})
   - Writing Principles: ${writingPrinciples}
   ${preferredVocab ? `- Naturally weave in brand words where suitable: [${preferredVocab}]` : ''}
   ${prohibitedVocab ? `- STRICTLY AVOID prohibited words: [${prohibitedVocab}]` : ''}

PLATFORM INSTRUCTIONS (${params.platform.toUpperCase()}):
${this.getPlatformInstructions(params.platform)}

OUTPUT FORMAT:
You MUST respond with ONLY a valid, parseable JSON object matching this exact schema:
{
  "headline": "A scroll-stopping hook or title",
  "mainCaption": "Engaging, high-converting copy body tailored to ${params.platform}",
  "keyBenefits": [
    "Key benefit or selling point 1",
    "Key benefit or selling point 2",
    "Key benefit or selling point 3"
  ],
  "cta": "${cta}",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "variations": [
    {
      "headline": "Alternative Variation 1 Headline",
      "mainCaption": "Alternative Variation 1 full caption text",
      "cta": "${cta}"
    },
    {
      "headline": "Alternative Variation 2 Headline",
      "mainCaption": "Alternative Variation 2 full caption text",
      "cta": "${cta}"
    }
  ]
}`;
  }

  private buildUserPrompt(params: GenerationParams, cta: string, keywords: string[]): string {
    let prompt = `PRODUCT / SERVICE / SUBJECT: ${params.topic}\n`;
    if (params.productDescription) prompt += `PRODUCT DETAILS & VALUE PROPOSITION: ${params.productDescription}\n`;
    if (params.campaign) prompt += `CAMPAIGN OBJECTIVE: ${params.campaign}\n`;
    if (params.audience) prompt += `TARGET AUDIENCE: ${params.audience}\n`;
    if (keywords.length > 0) prompt += `RELEVANT KEYWORDS / SELLING POINTS: ${keywords.join(', ')}\n`;
    prompt += `CALL TO ACTION: ${cta}\n`;
    if (params.instructions) prompt += `ADDITIONAL INSTRUCTIONS: ${params.instructions}\n`;
    if (params.memoryContext) {
      prompt += `\nBRAND MEMORY (follow approved examples and avoid patterns marked rejected):\n${params.memoryContext}\n`;
    }
    return prompt;
  }

  private getPlatformInstructions(platform: string): string {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
        return '- First line MUST be an irresistible scroll-stopping hook.\n- Use modern, tasteful formatting with intentional line breaks and emojis.\n- Tell an engaging visual story focused on customer benefit.\n- Include 5-8 highly relevant hashtags at the end.';
      case 'LINKEDIN':
        return '- Professional, visionary, and insightful.\n- Opening hook should address an industry challenge or innovation.\n- Use clean 1-2 sentence paragraphs for mobile readability.\n- Focus on business/customer outcomes.\n- 3-5 professional hashtags.';
      case 'TWITTER':
      case 'X':
        return '- Ultra-punchy, concise, high impact (under 280 characters).\n- Immediate hook with a clear takeaway and direct CTA.\n- 2-3 focused hashtags.';
      case 'EMAIL':
        return '- Compelling subject line that drives open rates.\n- Body with warm opening, clear value proposition, and bulleted highlights.\n- Prominent Call to Action button/link.';
      case 'BLOG':
        return '- Catchy, SEO-optimized headline.\n- Engaging intro hook.\n- 2-3 structured benefit subheadings.\n- Actionable conclusion with strong CTA.';
      case 'ECOMMERCE':
        return '- High-converting product description highlighting sensory and practical benefits.\n- Clear list of top 3 features and transformations.\n- Urgent, decisive CTA to purchase or explore.';
      case 'REWRITE':
      default:
        return '- Polish and elevate the content while keeping the core subject intact.\n- Sharpen rhythm, tone, and persuasive power according to brand guidelines.';
    }
  }

  private formatFullCopy(structured: StructuredContent, platform: string): string {
    const { headline, mainCaption, keyBenefits, cta, hashtags } = structured;
    const p = platform.toUpperCase();

    const bulletList = keyBenefits?.length
      ? keyBenefits.map((b) => `• ${b}`).join('\n')
      : '';
    const tagList = hashtags?.length ? hashtags.join(' ') : '';

    if (p === 'TWITTER' || p === 'X') {
      return `${headline}\n\n${mainCaption}\n\n👉 ${cta} ${tagList}`.trim();
    }

    if (p === 'EMAIL') {
      return `Subject: ${headline}\n\n${mainCaption}\n\nKey Highlights:\n${bulletList}\n\n👉 [${cta}]`.trim();
    }

    if (p === 'ECOMMERCE') {
      return `${headline}\n\n${mainCaption}\n\nWhy You'll Love It:\n${bulletList}\n\n🛍️ ${cta}`.trim();
    }

    if (p === 'BLOG') {
      return `# ${headline}\n\n${mainCaption}\n\n### Key Highlights\n${bulletList}\n\n---\n**Ready to get started?** 👉 ${cta}`.trim();
    }

    // Default Instagram / LinkedIn / general
    return `${headline}\n\n${mainCaption}\n\n${bulletList ? `${bulletList}\n\n` : ''}👉 ${cta}\n\n${tagList}`.trim();
  }

  private parseStructuredOutput(
    raw: string,
    params: GenerationParams,
    validatedCta: string,
    tokensUsed: number
  ): { content: string; structured: StructuredContent; variations: string[] } {
    try {
      const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const structured: StructuredContent = {
        headline: parsed.headline || `${params.topic} Announcement`,
        mainCaption: parsed.mainCaption || parsed.caption || parsed.content || raw.slice(0, 300),
        keyBenefits: Array.isArray(parsed.keyBenefits) ? parsed.keyBenefits : [],
        cta: parsed.cta || validatedCta,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      };

      const primaryFormatted = this.formatFullCopy(structured, params.platform);

      const variations: string[] = [];
      if (Array.isArray(parsed.variations)) {
        for (const v of parsed.variations) {
          if (v.mainCaption || v.content) {
            const varFormatted = `${v.headline ? `${v.headline}\n\n` : ''}${v.mainCaption || v.content}\n\n👉 ${v.cta || validatedCta}`;
            variations.push(varFormatted.trim());
          }
        }
      }

      return {
        content: primaryFormatted,
        structured,
        variations,
      };
    } catch (e) {
      logger.warn('Failed to parse AI output as JSON, falling back to clean text formatting');
      const cleanText = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const fallbackStructured: StructuredContent = {
        headline: `${params.topic} — Experience the Difference`,
        mainCaption: cleanText,
        keyBenefits: ['Premium quality and performance', 'Designed for everyday comfort', 'Guaranteed satisfaction'],
        cta: validatedCta,
        hashtags: [`#${params.topic.replace(/\s+/g, '')}`, '#QualityFirst', '#TrendingNow'],
      };
      return {
        content: cleanText,
        structured: fallbackStructured,
        variations: [],
      };
    }
  }

  /**
   * General LLM prompt runner used by consistency checks and website extraction.
   * Groq is primary; Gemini is the LangChain fallback.
   */
  async completePrompt(systemPrompt: string, userPrompt: string, temperature = 0.3): Promise<string> {
    const completion = await langchainService.complete(systemPrompt, userPrompt, temperature);
    return completion.text;
  }
}

export const aiService = new AIService();
