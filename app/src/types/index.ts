// Core Types for n8n Agent Dashboard

export interface N8nWorkflow {
  id: string;
  name: string;
  nodes: N8nNode[];
  connections: Record<string, N8nConnection[][]>;
  settings?: {
    executionOrder?: 'v1' | 'v0';
    saveManualExecutions?: boolean;
    callerPolicy?: string;
  };
  staticData?: any;
  tags?: string[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters?: Record<string, any>;
  credentials?: Record<string, any>;
  typeVersion?: number;
}

export interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

export interface WorkflowGenerationRequest {
  prompt: string;
  category: WorkflowCategory;
  preferredModel?: 'kimi' | 'gemini' | 'auto';
  similarWorkflows?: N8nWorkflow[];
}

export type WorkflowCategory = 
  | 'customer-support' 
  | 'content-generation' 
  | 'marketing' 
  | 'social-media' 
  | 'data-processing' 
  | 'competitive-intelligence' 
  | 'system-health' 
  | 'custom';

export interface WorkflowGenerationResult {
  workflow: N8nWorkflow;
  modelUsed: string;
  reasoning: string;
  dbId?: string;
}

export interface DeploymentResult {
  success: boolean;
  method: 'mcp' | 'browser-automation';
  n8nWorkflowId?: string;
  message?: string;
  error?: string;
}

export interface TestResult {
  success: boolean;
  executionData?: any;
  error?: string;
  durationMs?: number;
}

export interface WorkflowRecord {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  tags: string[];
  workflow_json: N8nWorkflow;
  original_prompt: string;
  ai_model_used: string;
  generation_params?: any;
  test_results?: TestResult[];
  iteration_count: number;
  parent_workflow_id?: string;
  status: WorkflowStatus;
  n8n_workflow_id?: string;
  deployment_method?: 'mcp' | 'browser-automation';
  version: number;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export type WorkflowStatus = 'draft' | 'testing' | 'deployed' | 'failed' | 'archived';

export interface ExecutionResult {
  success: boolean;
  executionId?: string;
  executionData?: any;
  errorMessage?: string;
  durationMs?: number;
}

export interface KnowledgeEntry {
  id: string;
  workflow_id: string;
  pattern_type: 'success_pattern' | 'error_pattern' | 'optimization';
  context: string;
  workflow_structure: any;
  outcome: 'success' | 'failure' | 'partial';
  error_logs?: string;
  embedding?: number[];
  created_at: string;
}

export interface DeploymentMode {
  id: 'mcp' | 'browser';
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'moonshot' | 'google';
  contextWindow: number;
  supportsThinking: boolean;
  pricing: {
    input: number;
    output: number;
    currency: string;
  };
}

export interface DashboardStats {
  totalWorkflows: number;
  deployedWorkflows: number;
  successRate: number;
  averageExecutionTime: number;
  totalExecutions: number;
  aiCostToday: number;
}

export interface ExecutionLog {
  id: string;
  workflow_id: string;
  n8n_execution_id?: string;
  status: 'success' | 'error' | 'waiting';
  execution_data?: any;
  error_message?: string;
  duration_ms?: number;
  ai_analysis?: string;
  suggested_fix?: any;
  created_at: string;
}
