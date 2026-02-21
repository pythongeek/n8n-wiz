import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import * as z from 'zod';

// n8n Workflow JSON Schema Validation
const N8nConnectionSchema = z.object({
  node: z.string(),
  type: z.string(),
  index: z.number(),
});

const N8nNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  position: z.array(z.number()),
  parameters: z.any(),
  credentials: z.any().optional(),
  typeVersion: z.number().optional(),
});

const N8nWorkflowSchema = z.object({
  name: z.string(),
  nodes: z.array(N8nNodeSchema),
  connections: z.record(z.string(), z.array(z.array(N8nConnectionSchema))),
  settings: z.any().optional(),
  staticData: z.any().optional(),
  tags: z.array(z.string()).optional(),
});

const WorkflowGenerationSchema = z.object({
  workflow: N8nWorkflowSchema,
  explanation: z.string(),
  estimatedComplexity: z.enum(['low', 'medium', 'high']),
  requiredCredentials: z.array(z.string()),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { description, category, preferredModel = 'gemini' } = req.body;

    if (!description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Description is required' 
      });
    }

    // Category-specific node templates
    const categoryTemplates: Record<string, string[]> = {
      'customer-support': [
        'n8n-nodes-base.webhook',
        'n8n-nodes-base.if',
        'n8n-nodes-base.httpRequest',
        'n8n-nodes-base.slack',
      ],
      'content-generation': [
        'n8n-nodes-base.scheduleTrigger',
        'n8n-nodes-base.httpRequest',
        'n8n-nodes-base.set',
      ],
      'marketing': [
        'n8n-nodes-base.webhook',
        'n8n-nodes-base.httpRequest',
        'n8n-nodes-base.slack',
      ],
      'social-media': [
        'n8n-nodes-base.scheduleTrigger',
        'n8n-nodes-base.httpRequest',
      ],
      'data-processing': [
        'n8n-nodes-base.webhook',
        'n8n-nodes-base.code',
        'n8n-nodes-base.postgres',
      ],
      'custom': [
        'n8n-nodes-base.webhook',
        'n8n-nodes-base.httpRequest',
        'n8n-nodes-base.code',
      ],
    };

    const templates = category ? categoryTemplates[category] || categoryTemplates['custom'] : categoryTemplates['custom'];

    const systemPrompt = `You are an expert n8n workflow automation specialist. Generate a complete, valid n8n workflow JSON based on the user's description.

CRITICAL RULES:
1. Generate ONLY valid n8n workflow JSON that can be imported directly into n8n
2. Use proper n8n node types (e.g., n8n-nodes-base.webhook, n8n-nodes-base.httpRequest)
3. Include all required parameters for each node
4. Create proper connections between nodes
5. Position nodes in a readable layout (use [x, y] coordinates)
6. Include appropriate trigger nodes at the start

Available node templates for this category: ${templates.join(', ')}

The workflow must include:
- A trigger node (webhook, schedule, or manual)
- Processing nodes based on the requirements
- Output/action nodes

Return a complete workflow object with name, nodes array, and connections object.`;

    let result;

    if (preferredModel === 'gemini') {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ 
          success: false, 
          error: 'Gemini API key not configured' 
        });
      }

      result = await generateObject({
        model: google('gemini-2.5-flash-preview-05-20', { apiKey: geminiApiKey }),
        schema: WorkflowGenerationSchema,
        prompt: `${systemPrompt}\n\nUser request: ${description}`,
        temperature: 0.3,
      });
    } else {
      // Use OpenAI-compatible endpoint for Kimi
      const kimiApiKey = process.env.KIMI_API_KEY;
      if (!kimiApiKey) {
        return res.status(500).json({ 
          success: false, 
          error: 'Kimi API key not configured' 
        });
      }

      result = await generateObject({
        model: openai('kimi-k2-0711-preview', { 
          apiKey: kimiApiKey,
          baseURL: 'https://api.moonshot.cn/v1'
        }),
        schema: WorkflowGenerationSchema,
        prompt: `${systemPrompt}\n\nUser request: ${description}`,
        temperature: 0.3,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.object,
      model: preferredModel
    });

  } catch (error: any) {
    console.error('Workflow Generation Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate workflow'
    });
  }
}
