-- Company Brain Database Schema
-- Run this in Supabase SQL Editor

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_email TEXT,
    plan TEXT DEFAULT 'free',
    max_integrations INTEGER DEFAULT 3,
    max_nodes INTEGER DEFAULT 500,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'member',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    access_token TEXT,
    refresh_token TEXT,
    workspace_id TEXT,
    workspace_name TEXT,
    metadata JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ,
    total_documents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, type)
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL,
    source_id TEXT,
    source_url TEXT,
    title TEXT,
    raw_content TEXT,
    content_hash TEXT,
    author_name TEXT,
    metadata JSONB DEFAULT '{}',
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, source_type, source_id)
);

-- Knowledge Nodes
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    applies_to TEXT,
    conditions TEXT,
    exceptions TEXT,
    confidence_score FLOAT DEFAULT 0.0,
    is_verified BOOLEAN DEFAULT false,
    is_outdated BOOLEAN DEFAULT false,
    outdated_reason TEXT,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    source_doc_ids UUID[] DEFAULT '{}',
    embedding vector(384),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector search index
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_embedding
ON knowledge_nodes
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Knowledge Edges
CREATE TABLE IF NOT EXISTS knowledge_edges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    from_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    weight FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_node_id, to_node_id, relationship_type)
);

-- Skills Files
CREATE TABLE IF NOT EXISTS skills_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0.0',
    status TEXT DEFAULT 'draft',
    content_json JSONB DEFAULT '{}',
    node_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query Feedback
CREATE TABLE IF NOT EXISTS query_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    was_helpful BOOLEAN NOT NULL,
    feedback_text TEXT,
    node_ids_used UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID,
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector search function
CREATE OR REPLACE FUNCTION search_knowledge_nodes(
    query_embedding vector(384),
    match_org_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    type TEXT,
    applies_to TEXT,
    conditions TEXT,
    exceptions TEXT,
    confidence_score FLOAT,
    is_verified BOOLEAN,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kn.id,
        kn.title,
        kn.content,
        kn.type,
        kn.applies_to,
        kn.conditions,
        kn.exceptions,
        kn.confidence_score,
        kn.is_verified,
        1 - (kn.embedding <=> query_embedding) AS similarity
    FROM knowledge_nodes kn
    WHERE
        kn.org_id = match_org_id
        AND kn.is_outdated = false
        AND kn.embedding IS NOT NULL
        AND 1 - (kn.embedding <=> query_embedding) > 0.3
    ORDER BY kn.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Disable RLS for development
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges DISABLE ROW LEVEL SECURITY;
ALTER TABLE skills_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE query_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;