-- Initialize pgvector extension for BrandVoice AI
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions
SELECT extname FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp');

-- Add pgvector column for semantic search on memory_records
-- This runs after Prisma migrations create the table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_records') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'memory_records' AND column_name = 'embedding_vec'
    ) THEN
      ALTER TABLE memory_records ADD COLUMN embedding_vec vector(1536);
      CREATE INDEX IF NOT EXISTS memory_records_embedding_vec_idx
        ON memory_records USING ivfflat (embedding_vec vector_cosine_ops) WITH (lists = 100);
    END IF;
  END IF;
END $$;

-- Add pgvector column for content embeddings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_embeddings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_embeddings' AND column_name = 'embedding_vec'
    ) THEN
      ALTER TABLE content_embeddings ADD COLUMN embedding_vec vector(1536);
      CREATE INDEX IF NOT EXISTS content_embeddings_embedding_vec_idx
        ON content_embeddings USING ivfflat (embedding_vec vector_cosine_ops) WITH (lists = 100);
    END IF;
  END IF;
END $$;
