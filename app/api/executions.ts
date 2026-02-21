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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get executions for a workflow
        const { workflow_id, limit = '50', status: execStatus } = req.query;
        
        let query = supabase
          .from('executions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(parseInt(limit as string));
        
        if (workflow_id) {
          query = query.eq('workflow_id', workflow_id);
        }
        
        if (execStatus) {
          query = query.eq('status', execStatus);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return res.status(200).json({ success: true, data });

      case 'POST':
        // Log a new execution
        const { workflow_id: newWorkflowId, status, duration, error: execError, output } = req.body;
        
        const { data: newExecution, error: createError } = await supabase
          .from('executions')
          .insert([{
            workflow_id: newWorkflowId,
            status,
            duration,
            error: execError,
            output,
            started_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        return res.status(201).json({ success: true, data: newExecution });

      case 'PUT':
        // Update execution status
        const { id, ...updates } = req.body;
        
        const { data: updatedExecution, error: updateError } = await supabase
          .from('executions')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return res.status(200).json({ success: true, data: updatedExecution });

      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
