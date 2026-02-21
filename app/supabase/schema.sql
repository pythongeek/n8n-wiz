-- =============================================================================
-- n8n Agent Dashboard - Supabase PostgreSQL Schema
-- =============================================================================
-- Run this in your Supabase SQL Editor to set up the database
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Workflows Table
-- Stores all generated and saved workflows
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_json JSONB NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'draft', -- draft, testing, deployed, archived
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for workflows
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);

-- =============================================================================
-- Executions Table
-- Tracks workflow execution history
-- =============================================================================
CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- running, success, failed, cancelled
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in milliseconds
    error TEXT,
    output JSONB,
    logs TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for executions
CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_started_at ON executions(started_at DESC);

-- =============================================================================
-- Knowledge Base Table
-- Stores learned patterns and auto-fix solutions
-- =============================================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern TEXT NOT NULL,
    pattern_type VARCHAR(100) NOT NULL, -- error_pattern, success_pattern, optimization
    category VARCHAR(100),
    description TEXT,
    solution JSONB,
    success_rate DECIMAL(5,2) DEFAULT 0, -- 0-100
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for knowledge base
CREATE INDEX idx_knowledge_pattern_type ON knowledge_base(pattern_type);
CREATE INDEX idx_knowledge_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_success_rate ON knowledge_base(success_rate DESC);

-- =============================================================================
-- Workflow Versions Table
-- Tracks version history for workflows
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflow_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    workflow_json JSONB NOT NULL,
    change_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for workflow versions
CREATE INDEX idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);
CREATE INDEX idx_workflow_versions_version ON workflow_versions(version);

-- =============================================================================
-- Deployment Logs Table
-- Tracks deployment attempts and results
-- =============================================================================
CREATE TABLE IF NOT EXISTS deployment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    deployment_method VARCHAR(50) NOT NULL, -- mcp-bridge, browser-automation
    target_url TEXT,
    status VARCHAR(50) NOT NULL, -- pending, success, failed
    error_message TEXT,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for deployment logs
CREATE INDEX idx_deployment_logs_workflow_id ON deployment_logs(workflow_id);
CREATE INDEX idx_deployment_logs_status ON deployment_logs(status);

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Allow read access to all authenticated users" ON workflows
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for authenticated users" ON workflows
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow update for workflow owners" ON workflows
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Allow delete for workflow owners" ON workflows
    FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Executions policies
CREATE POLICY "Allow read access to executions" ON executions
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM workflows 
            WHERE workflows.id = executions.workflow_id 
            AND workflows.created_by = auth.uid()
        )
    );

CREATE POLICY "Allow insert executions" ON executions
    FOR INSERT TO authenticated WITH CHECK (true);

-- Knowledge base policies (read-only for most users)
CREATE POLICY "Allow read access to knowledge base" ON knowledge_base
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert to knowledge base" ON knowledge_base
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update to knowledge base" ON knowledge_base
    FOR UPDATE TO authenticated USING (true);

-- Workflow versions policies
CREATE POLICY "Allow read access to workflow versions" ON workflow_versions
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM workflows 
            WHERE workflows.id = workflow_versions.workflow_id 
            AND workflows.created_by = auth.uid()
        )
    );

CREATE POLICY "Allow insert workflow versions" ON workflow_versions
    FOR INSERT TO authenticated WITH CHECK (true);

-- Deployment logs policies
CREATE POLICY "Allow read access to deployment logs" ON deployment_logs
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM workflows 
            WHERE workflows.id = deployment_logs.workflow_id 
            AND workflows.created_by = auth.uid()
        )
    );

CREATE POLICY "Allow insert deployment logs" ON deployment_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- Functions and Triggers
-- =============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp trigger to tables
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment usage count function
CREATE OR REPLACE FUNCTION increment_knowledge_usage(pattern_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE knowledge_base 
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = pattern_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Views
-- =============================================================================

-- Workflow stats view
CREATE OR REPLACE VIEW workflow_stats AS
SELECT 
    w.id,
    w.name,
    w.status,
    w.category,
    w.created_at,
    w.updated_at,
    COUNT(e.id) as total_executions,
    COUNT(CASE WHEN e.status = 'success' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed_executions,
    AVG(e.duration) as avg_execution_time
FROM workflows w
LEFT JOIN executions e ON w.id = e.workflow_id
GROUP BY w.id, w.name, w.status, w.category, w.created_at, w.updated_at;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    e.id,
    e.workflow_id,
    w.name as workflow_name,
    e.status,
    e.started_at,
    e.duration,
    'execution' as activity_type
FROM executions e
JOIN workflows w ON e.workflow_id = w.id
UNION ALL
SELECT 
    d.id,
    d.workflow_id,
    w.name as workflow_name,
    d.status,
    d.deployed_at as started_at,
    NULL as duration,
    'deployment' as activity_type
FROM deployment_logs d
JOIN workflows w ON d.workflow_id = w.id
ORDER BY started_at DESC;

-- =============================================================================
-- Sample Data (Optional - for testing)
-- =============================================================================

-- Insert sample workflow categories into knowledge base
INSERT INTO knowledge_base (pattern, pattern_type, category, description, solution, success_rate)
VALUES 
    ('webhook_timeout', 'error_pattern', 'system-health', 'Webhook node timeout errors', '{"action": "increase_timeout", "value": 30000}'::jsonb, 95.5),
    ('api_rate_limit', 'error_pattern', 'data-processing', 'API rate limit exceeded', '{"action": "add_delay", "value": 1000}'::jsonb, 92.0),
    ('missing_credentials', 'error_pattern', 'custom', 'Missing or invalid credentials', '{"action": "prompt_credentials"}'::jsonb, 100.0)
ON CONFLICT DO NOTHING;
