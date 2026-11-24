import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import {
  EMBEDDING_DIMENSIONS,
  cosineSimilarity,
  localEmbedding,
  toVectorLiteral,
} from '../lib/embeddingMath';

export interface MemoryHit {
  id: string;
  brandId: string;
  content: string;
  type: string;
  similarity: number;
  createdAt: string;
}

function usableKey(value: string | undefined): string {
  const key = (value || '').trim();
  if (!key || key.startsWith('your-')) return '';
  return key;
}

export class EmbeddingService {
  /**
   * OpenAI embeddings when configured, otherwise Gemini, otherwise a local hash embedding.
   * Every path returns a 1536-dimension vector so pgvector storage stays consistent.
   */
  async getEmbedding(text: string): Promise<number[]> {
    const input = text.slice(0, 8000);
    const openaiKey = usableKey(process.env.OPENAI_API_KEY);
    const geminiKey = usableKey(process.env.GOOGLE_AI_API_KEY);

    if (openaiKey) {
      try {
        return await this.embedWithOpenAI(input, openaiKey);
      } catch (error: any) {
        logger.warn('OpenAI embedding failed, trying the next provider:', error.message);
      }
    }

    if (geminiKey) {
      try {
        return await this.embedWithGemini(input, geminiKey);
      } catch (error: any) {
        logger.warn('Gemini embedding failed, using local embeddings:', error.message);
      }
    }

    return localEmbedding(input);
  }

  async saveMemory(brandId: string, content: string, type = 'approved', platform?: string): Promise<string | null> {
    try {
      const embedding = await this.getEmbedding(content);
      const memory = await prisma.memoryRecord.create({
        data: {
          brandId,
          content,
          type,
          platform,
          embedding: JSON.stringify(embedding),
        },
      });
      await this.writeVector(memory.id, embedding);
      logger.info(`Saved brand memory record: ${memory.id}`);
      return memory.id;
    } catch (err: any) {
      logger.warn('Failed to save memory record:', err.message);
      return null;
    }
  }

  /**
   * Brand-scoped similarity search. Uses pgvector when the vector column exists.
   */
  async searchSimilar(brandId: string, query: string, limit = 8): Promise<MemoryHit[]> {
    const queryVector = await this.getEmbedding(query);
    const vectorHits = await this.searchWithPgvector(brandId, queryVector, limit);
    if (vectorHits) return vectorHits;
    return this.searchInProcess(brandId, queryVector, limit);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    return cosineSimilarity(a, b);
  }

  private async embedWithOpenAI(input: string, apiKey: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        input,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI Embedding API error (${response.status})`);
    }
    const data: any = await response.json();
    return data.data[0].embedding as number[];
  }

  private async embedWithGemini(input: string, apiKey: string): Promise<number[]> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text: input }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Gemini Embedding API error (${response.status})`);
    }
    const data: any = await response.json();
    const values = data.embedding?.values as number[] | undefined;
    if (!values?.length) throw new Error('Gemini embedding response was empty');
    if (values.length === EMBEDDING_DIMENSIONS) return values;
    const padded = values.slice(0, EMBEDDING_DIMENSIONS);
    while (padded.length < EMBEDDING_DIMENSIONS) padded.push(0);
    return padded;
  }

  private async writeVector(id: string, embedding: number[]): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE memory_records SET embedding_vec = $1::vector WHERE id = $2`,
        toVectorLiteral(embedding),
        id
      );
    } catch (error: any) {
      logger.warn('pgvector column update skipped:', error.message);
    }
  }

  private async searchWithPgvector(brandId: string, queryVector: number[], limit: number): Promise<MemoryHit[] | null> {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{
        id: string;
        brandId: string;
        content: string;
        type: string;
        similarity: number;
        createdAt: Date;
      }>>(
        `SELECT id, "brandId", content, type,
                (1 - (embedding_vec <=> $1::vector)) AS similarity,
                "createdAt"
         FROM memory_records
         WHERE "brandId" = $2 AND "isActive" = true AND embedding_vec IS NOT NULL
         ORDER BY embedding_vec <=> $1::vector
         LIMIT $3`,
        toVectorLiteral(queryVector),
        brandId,
        limit
      );
      return rows.map((row) => ({
        id: row.id,
        brandId: row.brandId,
        content: row.content,
        type: row.type,
        similarity: Number(row.similarity) || 0,
        createdAt: new Date(row.createdAt).toISOString(),
      }));
    } catch (error: any) {
      logger.warn('pgvector search unavailable, using in-process similarity:', error.message);
      return null;
    }
  }

  private async searchInProcess(brandId: string, queryVector: number[], limit: number): Promise<MemoryHit[]> {
    const records = await prisma.memoryRecord.findMany({
      where: { brandId, isActive: true, embedding: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return records
      .map((record) => {
        let similarity = 0;
        try {
          similarity = cosineSimilarity(queryVector, JSON.parse(record.embedding!));
        } catch {
          similarity = 0;
        }
        return {
          id: record.id,
          brandId: record.brandId,
          content: record.content,
          type: record.type,
          similarity,
          createdAt: record.createdAt.toISOString(),
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

export const embeddingService = new EmbeddingService();
