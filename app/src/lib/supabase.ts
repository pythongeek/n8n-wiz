import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Helper functions for common operations

/**
 * Fetch all workflows with optional filtering
 */
export async function fetchWorkflows(options?: {
  status?: string;
  category?: string;
  limit?: number;
}) {
  let query = supabase
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workflows:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single workflow by ID
 */
export async function fetchWorkflowById(id: string) {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching workflow:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new workflow
 */
export async function createWorkflow(workflow: {
  name: string;
  description?: string;
  workflow_json: object;
  category?: string;
  tags?: string[];
  status?: string;
}) {
  const { data, error } = await supabase
    .from('workflows')
    .insert([{
      ...workflow,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating workflow:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing workflow
 */
export async function updateWorkflow(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    workflow_json: object;
    category: string;
    tags: string[];
    status: string;
  }>
) {
  const { data, error } = await supabase
    .from('workflows')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating workflow:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string) {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting workflow:', error);
    throw error;
  }
}

/**
 * Fetch executions for a workflow
 */
export async function fetchExecutions(workflowId?: string, limit: number = 50) {
  let query = supabase
    .from('executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (workflowId) {
    query = query.eq('workflow_id', workflowId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching executions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Log a new execution
 */
export async function logExecution(execution: {
  workflow_id: string;
  status: string;
  duration?: number;
  error?: string;
  output?: object;
}) {
  const { data, error } = await supabase
    .from('executions')
    .insert([{
      ...execution,
      started_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error logging execution:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch knowledge base entries
 */
export async function fetchKnowledgeBase(options?: {
  pattern_type?: string;
  category?: string;
  search?: string;
  limit?: number;
}) {
  let query = supabase
    .from('knowledge_base')
    .select('*')
    .order('success_rate', { ascending: false });

  if (options?.pattern_type) {
    query = query.eq('pattern_type', options.pattern_type);
  }

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.search) {
    query = query.or(`pattern.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching knowledge base:', error);
    throw error;
  }

  return data || [];
}

/**
 * Add a knowledge base entry
 */
export async function addKnowledgeEntry(entry: {
  pattern: string;
  pattern_type: string;
  category?: string;
  description?: string;
  solution?: object;
  success_rate?: number;
}) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert([{
      ...entry,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding knowledge entry:', error);
    throw error;
  }

  return data;
}

/**
 * Update knowledge entry usage
 */
export async function incrementKnowledgeUsage(id: string) {
  const { data, error } = await supabase
    .rpc('increment_knowledge_usage', { pattern_id: id });

  if (error) {
    console.error('Error incrementing knowledge usage:', error);
    throw error;
  }

  return data;
}

/**
 * Subscribe to real-time workflow changes
 */
export function subscribeToWorkflows(callback: (payload: any) => void) {
  return supabase
    .channel('workflows-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'workflows' },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to real-time execution changes
 */
export function subscribeToExecutions(callback: (payload: any) => void) {
  return supabase
    .channel('executions-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'executions' },
      callback
    )
    .subscribe();
}
