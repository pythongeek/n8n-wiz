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
        // Get knowledge base entries
        const { pattern_type, category, search, limit = '20' } = req.query;
        
        let query = supabase
          .from('knowledge_base')
          .select('*')
          .order('success_rate', { ascending: false })
          .limit(parseInt(limit as string));
        
        if (pattern_type) {
          query = query.eq('pattern_type', pattern_type);
        }
        
        if (category) {
          query = query.eq('category', category);
        }
        
        if (search) {
          query = query.or(`pattern.ilike.%${search}%,description.ilike.%${search}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return res.status(200).json({ success: true, data });

      case 'POST':
        // Add a new knowledge entry
        const { 
          pattern, 
          pattern_type: newPatternType, 
          category: newCategory,
          description,
          solution,
          success_rate = 0,
          usage_count = 0
        } = req.body;
        
        const { data: newEntry, error: createError } = await supabase
          .from('knowledge_base')
          .insert([{
            pattern,
            pattern_type: newPatternType,
            category: newCategory,
            description,
            solution,
            success_rate,
            usage_count,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        return res.status(201).json({ success: true, data: newEntry });

      case 'PUT':
        // Update knowledge entry (e.g., increment usage count)
        const { id, ...updates } = req.body;
        
        const { data: updatedEntry, error: updateError } = await supabase
          .from('knowledge_base')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return res.status(200).json({ success: true, data: updatedEntry });

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
