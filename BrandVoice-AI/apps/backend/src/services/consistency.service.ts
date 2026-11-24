import { aiService } from './ai.service';
import { logger } from '../lib/logger';

export interface ConsistencyEvaluation {
  overallScore: number;
  toneScore: number;
  vocabularyScore: number;
  writingStyleScore: number;
  sentenceStructureScore: number;
  issues: Array<{
    type: 'tone' | 'vocabulary' | 'style' | 'structure';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion?: string;
  }>;
  suggestions: string[];
}

export const SCORE_WEIGHTS = {
  tone: 0.35,
  vocabulary: 0.25,
  style: 0.25,
  structure: 0.15,
} as const;

export function combineScores(tone: number, vocabulary: number, style: number, structure: number): number {
  return Math.round(
    tone * SCORE_WEIGHTS.tone +
    vocabulary * SCORE_WEIGHTS.vocabulary +
    style * SCORE_WEIGHTS.style +
    structure * SCORE_WEIGHTS.structure
  );
}

export interface BrandConsistencyContext {
  brandName?: string;
  toneOfVoice?: string;
  writingPrinciples?: string;
  preferredVocabulary?: string[];
  prohibitedVocabulary?: string[];
  platform?: string;
}

export class ConsistencyService {
  /**
   * Evaluate content consistency against brand voice guidelines
   */
  async evaluate(content: string, context: BrandConsistencyContext): Promise<ConsistencyEvaluation> {
    const prohibitedWords = context.prohibitedVocabulary?.length
      ? context.prohibitedVocabulary
      : ['cheap', 'basic', 'simple', 'just', 'obviously', 'simply'];

    const preferredWords = context.preferredVocabulary?.length
      ? context.preferredVocabulary
      : ['empower', 'streamline', 'scale', 'intelligent', 'seamless', 'enterprise-grade', 'optimize', 'transform'];

    const issues: ConsistencyEvaluation['issues'] = [];
    const suggestions: string[] = [];

    // ── 1. Vocabulary Analysis (25% weight) ──────────────────────────────────
    let vocabScore = 100;
    const lowerContent = content.toLowerCase();

    for (const word of prohibitedWords) {
      const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        vocabScore = Math.max(20, vocabScore - matches.length * 15);
        issues.push({
          type: 'vocabulary',
          severity: 'high',
          description: `Prohibited vocabulary detected: "${word}" (${matches.length}x)`,
          suggestion: `Remove "${word}" or replace with brand-approved terminology.`,
        });
      }
    }

    let preferredCount = 0;
    for (const word of preferredWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        preferredCount++;
      }
    }

    if (preferredCount === 0 && content.length > 80) {
      vocabScore = Math.max(40, vocabScore - 15);
      issues.push({
        type: 'vocabulary',
        severity: 'low',
        description: 'Missing signature brand vocabulary.',
        suggestion: `Weave in preferred terms like: ${preferredWords.slice(0, 4).join(', ')}`,
      });
      suggestions.push(`Naturally incorporate preferred terminology: ${preferredWords.slice(0, 4).join(', ')}`);
    }

    // ── 2. Writing Style Analysis (25% weight) ───────────────────────────────
    let styleScore = 90;
    const sentences = content.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
    const words = content.trim().split(/\s+/).filter(Boolean);
    const avgSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;

    // A. Long sentence check (>25 words)
    const longSentences = sentences.filter((s) => s.split(/\s+/).length > 25);
    if (longSentences.length > 0) {
      styleScore = Math.max(35, styleScore - longSentences.length * 10);
      issues.push({
        type: 'style',
        severity: 'medium',
        description: `${longSentences.length} sentence(s) exceed 25 words in length.`,
        suggestion: 'Break lengthy compound sentences into crisp, punchy statements (15–20 words optimal).',
      });
      suggestions.push('Shorten sentences exceeding 25 words to enhance mobile readability.');
    }

    // B. Sentence fragmentation
    if (avgSentenceLength < 8 && words.length > 40) {
      styleScore = Math.max(50, styleScore - 12);
      issues.push({
        type: 'style',
        severity: 'low',
        description: 'Sentences are overly brief/fragmented.',
        suggestion: 'Combine short fragments to improve narrative cadence and flow.',
      });
    }

    // C. Repetitive words
    const wordCounts: Record<string, number> = {};
    for (const w of words) {
      const cleanW = w.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanW.length > 4) {
        wordCounts[cleanW] = (wordCounts[cleanW] || 0) + 1;
      }
    }
    const repeated = Object.entries(wordCounts).filter(([w, c]) => c >= 4 && !['about', 'their', 'which', 'there', 'brand'].includes(w));
    if (repeated.length > 0) {
      styleScore = Math.max(40, styleScore - repeated.length * 6);
      issues.push({
        type: 'style',
        severity: 'low',
        description: `Repetitive words detected: ${repeated.map(([w, c]) => `"${w}" (${c}x)`).join(', ')}`,
        suggestion: 'Use synonyms to avoid repetitive phrasing.',
      });
    }

    // D. Unsupported marketing claims / hyperbole
    const unsupportedClaims = [
      /1000%\s*(better|faster|cheaper)/i,
      /\b(guaranteed\s*miracle|cure-all|best\s*in\s*the\s*world|instant\s*wealth|zero\s*risk)\b/i,
      /\b(secret\s*trick|magic\s*formula)\b/i,
    ];
    for (const claimRegex of unsupportedClaims) {
      if (claimRegex.test(content)) {
        styleScore = Math.max(40, styleScore - 15);
        issues.push({
          type: 'style',
          severity: 'high',
          description: 'Contains potentially exaggerated or unsupported marketing claims.',
          suggestion: 'Replace hyperbolic claims with concrete, verifiable customer outcomes.',
        });
        break;
      }
    }

    // ── 3. Content Structure Analysis (15% weight) ───────────────────────────
    let structureScore = 90;
    const hasCta = /(start|try|sign up|learn more|visit|click|discover|join|get started|demo|contact|shop now|find your fit|order|explore)/i.test(content);
    if (!hasCta && words.length > 25) {
      structureScore = Math.max(45, structureScore - 20);
      issues.push({
        type: 'structure',
        severity: 'medium',
        description: 'Missing an explicit Call to Action (CTA).',
        suggestion: 'Add a distinct closing CTA inviting the audience to take the next step.',
      });
      suggestions.push('Add a clear call to action (e.g. Shop Now, Learn More, Find Your Fit).');
    }

    // Platform-specific formatting rules
    if (context.platform) {
      const p = context.platform.toUpperCase();
      if ((p === 'TWITTER' || p === 'X') && content.length > 280) {
        structureScore = Math.max(30, structureScore - 30);
        issues.push({
          type: 'structure',
          severity: 'high',
          description: `Character count (${content.length}) exceeds the 280-character limit for X / Twitter.`,
          suggestion: 'Trim copy to under 280 characters for Twitter compliance.',
        });
      }
      if (p === 'INSTAGRAM' && !/#\w+/.test(content) && words.length > 20) {
        structureScore = Math.max(60, structureScore - 12);
        suggestions.push('Add 3–6 relevant hashtags at the bottom for Instagram reach.');
      }
    }

    // ── 4. Tone Adherence Analysis (35% weight) via LLM ─────────────────────
    let toneScore = 82;
    try {
      const llmResult = await this.evaluateToneWithLLM(content, context);
      toneScore = llmResult.toneScore;
      if (llmResult.toneIssue) {
        issues.push({
          type: 'tone',
          severity: llmResult.toneScore < 70 ? 'high' : 'medium',
          description: llmResult.toneIssue,
          suggestion: llmResult.toneSuggestion,
        });
      }
      if (llmResult.additionalSuggestion) {
        suggestions.push(llmResult.additionalSuggestion);
      }
    } catch (e: any) {
      logger.warn('LLM tone evaluation skipped, using heuristics:', e.message);
    }

    // ── Calculate Composite Overall Score ────────────────────────────────────
    // Tone: 35%, Vocab: 25%, Style: 25%, Structure: 15%
    const overallScore = combineScores(toneScore, vocabScore, styleScore, structureScore);

    if (issues.length === 0) {
      suggestions.push('Flawless compliance with brand tone and guidelines!');
    }

    return {
      overallScore: Math.min(100, Math.max(10, overallScore)),
      toneScore: Math.min(100, Math.max(10, toneScore)),
      vocabularyScore: Math.min(100, Math.max(10, vocabScore)),
      writingStyleScore: Math.min(100, Math.max(10, styleScore)),
      sentenceStructureScore: Math.min(100, Math.max(10, structureScore)),
      issues,
      suggestions: Array.from(new Set(suggestions)),
    };
  }

  /**
   * Fast LLM evaluation for brand tone adherence
   */
  private async evaluateToneWithLLM(
    content: string,
    context: BrandConsistencyContext
  ): Promise<{ toneScore: number; toneIssue?: string; toneSuggestion?: string; additionalSuggestion?: string }> {
    const targetTone = context.toneOfVoice || 'Professional, empowering, data-driven with human warmth';
    const principles = context.writingPrinciples || 'Lead with value. Punchy active voice. No empty buzzwords.';

    const systemPrompt = `You are an automated brand voice auditor. 
Evaluate the provided text against this target brand voice:
Target Tone: "${targetTone}"
Writing Principles: "${principles}"

Respond ONLY with a JSON object in this exact schema (no markdown, no extra commentary):
{
  "toneScore": <number between 30 and 100>,
  "toneIssue": <string description of tone discrepancy, or null if tone is great>,
  "toneSuggestion": <string recommendation for tone fix, or null>,
  "additionalSuggestion": <string overall improvement tip, or null>
}`;

    const raw = await aiService.completePrompt(systemPrompt, `Content to analyze:\n"""\n${content}\n"""`, 0.1);

    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      toneScore: typeof parsed.toneScore === 'number' ? parsed.toneScore : 80,
      toneIssue: parsed.toneIssue || undefined,
      toneSuggestion: parsed.toneSuggestion || undefined,
      additionalSuggestion: parsed.additionalSuggestion || undefined,
    };
  }

  /**
   * Automatically rewrite/improve content to fix all consistency issues
   */
  async improve(content: string, context: BrandConsistencyContext, evaluation: ConsistencyEvaluation): Promise<string> {
    const issuesSummary = evaluation.issues.map((i) => `- ${i.description} (Suggestion: ${i.suggestion})`).join('\n');
    const preferredVocab = context.preferredVocabulary?.join(', ') || 'empower, streamline, scale, enterprise-grade, seamless';
    const prohibitedVocab = context.prohibitedVocabulary?.join(', ') || 'cheap, basic, simple, just, obviously';

    const systemPrompt = `You are BrandVoice AI content optimizer.
Your task is to take the provided draft and rewrite it so it achieves a 95%+ brand consistency score.

BRAND GUIDELINES:
- Brand Name: ${context.brandName || 'BrandVoice AI'}
- Target Tone: ${context.toneOfVoice || 'Professional, empowering, data-driven with human warmth'}
- Preferred Vocabulary to use: [${preferredVocab}]
- Strictly Prohibited Words to eliminate: [${prohibitedVocab}]

DETECTED ISSUES TO RESOLVE:
${issuesSummary || 'Elevate the vocabulary and sharpen the value proposition.'}

REQUIREMENTS:
- Completely eliminate any prohibited words.
- Maintain the original core message and intent.
- Polish rhythm, sentence length (15-22 words avg), and call-to-action.
- Return ONLY the improved copy ready to publish. No conversational preamble.`;

    const improved = await aiService.completePrompt(systemPrompt, `Original Content:\n"""\n${content}\n"""`, 0.4);
    return improved.trim();
  }
}

export const consistencyService = new ConsistencyService();
