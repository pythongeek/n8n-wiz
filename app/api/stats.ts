import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get workflow counts by status
    const { data: workflowStats, error: workflowError } = await supabase
      .from('workflows')
      .select('status');

    if (workflowError) throw workflowError;

    const workflowsByStatus = workflowStats?.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get execution stats
    const { data: executionStats, error: executionError } = await supabase
      .from('executions')
      .select('status, duration');

    if (executionError) throw executionError;

    const executionsByStatus = executionStats?.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const totalExecutions = executionStats?.length || 0;
    const successfulExecutions = executionsByStatus['success'] || 0;
    const failedExecutions = executionsByStatus['failed'] || 0;
    const successRate = totalExecutions > 0 
      ? Math.round((successfulExecutions / totalExecutions) * 100) 
      : 0;

    // Calculate average execution time
    const avgExecutionTime = executionStats && executionStats.length > 0
      ? Math.round(executionStats.reduce((sum: number, curr: any) => sum + (curr.duration || 0), 0) / executionStats.length)
      : 0;

    // Get recent executions (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentExecutions, error: recentError } = await supabase
      .from('executions')
      .select('*')
      .gte('started_at', last24Hours);

    if (recentError) throw recentError;

    // Get knowledge base stats
    const { data: knowledgeStats, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('success_rate');

    if (knowledgeError) throw knowledgeError;

    const avgKnowledgeSuccess = knowledgeStats && knowledgeStats.length > 0
      ? Math.round(knowledgeStats.reduce((sum: number, curr: any) => sum + (curr.success_rate || 0), 0) / knowledgeStats.length)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        workflows: {
          total: workflowStats?.length || 0,
          byStatus: workflowsByStatus
        },
        executions: {
          total: totalExecutions,
          successful: successfulExecutions,
          failed: failedExecutions,
          successRate,
          avgExecutionTime,
          last24Hours: recentExecutions?.length || 0
        },
        knowledge: {
          totalPatterns: knowledgeStats?.length || 0,
          avgSuccessRate: avgKnowledgeSuccess
        }
      }
    });

  } catch (error: any) {
    console.error('Stats API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
