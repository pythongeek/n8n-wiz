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
        // Get all workflows or a specific workflow
        const { id, status, category } = req.query;
        
        if (id) {
          const { data, error } = await supabase
            .from('workflows')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          return res.status(200).json({ success: true, data });
        }
        
        let query = supabase.from('workflows').select('*');
        
        if (status) {
          query = query.eq('status', status);
        }
        
        if (category) {
          query = query.eq('category', category);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return res.status(200).json({ success: true, data });

      case 'POST':
        // Create a new workflow
        const { name, description, workflow_json, category, tags, status: workflowStatus } = req.body;
        
        const { data: newWorkflow, error: createError } = await supabase
          .from('workflows')
          .insert([{
            name,
            description,
            workflow_json,
            category,
            tags,
            status: workflowStatus || 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        return res.status(201).json({ success: true, data: newWorkflow });

      case 'PUT':
        // Update a workflow
        const { id: updateId, ...updates } = req.body;
        
        const { data: updatedWorkflow, error: updateError } = await supabase
          .from('workflows')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', updateId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return res.status(200).json({ success: true, data: updatedWorkflow });

      case 'DELETE':
        // Delete a workflow
        const { id: deleteId } = req.query;
        
        const { error: deleteError } = await supabase
          .from('workflows')
          .delete()
          .eq('id', deleteId);
        
        if (deleteError) throw deleteError;
        return res.status(200).json({ success: true, message: 'Workflow deleted' });

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
