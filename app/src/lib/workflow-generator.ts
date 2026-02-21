import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import * as z from 'zod';
import type { 
  N8nWorkflow, 
  WorkflowGenerationRequest, 
  WorkflowGenerationResult,
  WorkflowCategory 
} from '@/types';

// n8n Workflow JSON Schema Validation - simplified for zod v4
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
  credentials: z.any(),
  typeVersion: z.number().optional(),
});

const N8nWorkflowSchema = z.object({
  name: z.string(),
  nodes: z.array(N8nNodeSchema),
  connections: z.record(z.string(), z.array(z.array(N8nConnectionSchema))),
  settings: z.any(),
  staticData: z.any(),
  tags: z.array(z.string()).optional(),
});

// Category-specific node templates
const CATEGORY_TEMPLATES: Record<WorkflowCategory, string[]> = {
  'customer-support': [
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.if',
    'n8n-nodes-base.httpRequest',
    'n8n-nodes-base.slack',
    'n8n-nodes-base.zendesk',
  ],
  'content-generation': [
    'n8n-nodes-base.scheduleTrigger',
    'n8n-nodes-base.httpRequest',
    'n8n-nodes-base.set',
    'n8n-nodes-base.wordpress',
    'n8n-nodes-base.twitter',
  ],
  'marketing': [
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.googleAds',
    'n8n-nodes-base.facebookGraphApi',
    'n8n-nodes-base.httpRequest',
    'n8n-nodes-base.slack',
  ],
  'social-media': [
    'n8n-nodes-base.scheduleTrigger',
    'n8n-nodes-base.twitter',
    'n8n-nodes-base.linkedin',
    'n8n-nodes-base.instagram',
    'n8n-nodes-base.buffer',
  ],
  'data-processing': [
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.spreadsheetFile',
    'n8n-nodes-base.code',
    'n8n-nodes-base.postgres',
    'n8n-nodes-base.s3',
  ],
  'competitive-intelligence': [
    'n8n-nodes-base.scheduleTrigger',
    'n8n-nodes-base.httpRequest',
    'n8n-nodes-base.rssFeedRead',
    'n8n-nodes-base.serpAPI',
    'n8n-nodes-base.slack',
  ],
  'system-health': [
    'n8n-nodes-base.scheduleTrigger',
    'n8n-nodes-base.httpRequest',
    'n8n-nodes-base.if',
    'n8n-nodes-base.slack',
    'n8n-nodes-base.email',
  ],
  'custom': [
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.httpRequest',
    'n8n-nodes-base.code',
    'n8n-nodes-base.set',
    'n8n-nodes-base.noOp',
  ],
};

export class WorkflowGenerator {
  private kimiApiKey: string;
  private geminiApiKey: string;

  constructor() {
    this.kimiApiKey = import.meta.env.VITE_KIMI_API_KEY || '';
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  async generateWorkflow(req: WorkflowGenerationRequest): Promise<WorkflowGenerationResult> {
    const model = this.selectModel(req.prompt, req.preferredModel);
    const context = await this.buildContext(req);
    
    if (model === 'kimi') {
      return this.generateWithKimi(req, context);
    } else {
      return this.generateWithGemini(req, context);
    }
  }

  private selectModel(
    prompt: string, 
    preferred?: 'kimi' | 'gemini' | 'auto'
  ): 'kimi' | 'gemini' {
    if (preferred && preferred !== 'auto') return preferred;
    
    // Kimi 2.5 for complex reasoning, Gemini for speed/cost
    const complexity = this.assessComplexity(prompt);
    return complexity > 7 ? 'kimi' : 'gemini';
  }

  private assessComplexity(prompt: string): number {
    const keywords = [
      'conditional', 'loop', 'error-handling', 'webhook', 'api', 
      'database', 'complex', 'multi-step', 'analysis', 'reasoning'
    ];
    let score = prompt.length / 100;
    keywords.forEach(k => {
      if (prompt.toLowerCase().includes(k)) score += 1;
    });
    return Math.min(score, 10);
  }

  private async generateWithKimi(
    req: WorkflowGenerationRequest, 
    context: string
  ): Promise<WorkflowGenerationResult> {
    if (!this.kimiApiKey) {
      throw new Error('Kimi API key not configured');
    }

    try {
      const result = await generateObject({
        model: openai('kimi-k2-5'),
        schema: N8nWorkflowSchema,
        prompt: this.buildPrompt(req, context),
      });

      return {
        workflow: result.object as N8nWorkflow,
        modelUsed: 'kimi-2.5-thinking',
        reasoning: 'Complex workflow generated with extended reasoning',
      };
    } catch (error) {
      console.error('Kimi generation failed, falling back to Gemini:', error);
      return this.generateWithGemini(req, context);
    }
  }

  private async generateWithGemini(
    req: WorkflowGenerationRequest, 
    context: string
  ): Promise<WorkflowGenerationResult> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const result = await generateObject({
      model: google('gemini-2.5-pro-exp-03-25'),
      schema: N8nWorkflowSchema,
      prompt: this.buildPrompt(req, context),
    });

    return {
      workflow: result.object as N8nWorkflow,
      modelUsed: 'gemini-2.5-pro',
      reasoning: 'Generated with 1M token context window',
    };
  }

  private buildPrompt(req: WorkflowGenerationRequest, context: string): string {
    const commonNodes = CATEGORY_TEMPLATES[req.category] || CATEGORY_TEMPLATES.custom;
    
    return `You are an expert n8n workflow architect. Create a production-ready n8n workflow JSON based on the following requirement.

REQUIREMENT: ${req.prompt}
CATEGORY: ${req.category}

N8N WORKFLOW JSON STRUCTURE RULES:
1. Each node must have unique "id" (UUID format) and "name"
2. "type" must be valid n8n node type (e.g., "n8n-nodes-base.webhook", "n8n-nodes-base.httpRequest")
3. "connections" map node names to their output connections
4. "main" connections are for standard data flow
5. Position nodes in a readable layout (x: horizontal, y: vertical)
6. Include proper error handling with "n8n-nodes-base.if" nodes where appropriate

RECOMMENDED NODE TYPES FOR THIS CATEGORY:
${commonNodes.join('\n')}

PAST SUCCESSFUL PATTERNS:
${context}

Generate a complete, valid n8n workflow JSON that can be imported directly into n8n.
Include proper error handling nodes and credential placeholders where needed.

The workflow should:
- Have a clear trigger node (webhook, schedule, or manual)
- Include at least one AI/LLM node for processing
- Have proper error handling branches
- Include data transformation nodes as needed
- End with an action node (send notification, store data, etc.)
`;
  }

  private async buildContext(req: WorkflowGenerationRequest): Promise<string> {
    // In production, this would query Supabase for similar successful workflows
    // For now, return generic guidance based on category
    const categoryGuidance: Record<WorkflowCategory, string> = {
      'customer-support': 'Successful patterns: Use webhook trigger for ticket intake, sentiment analysis node, conditional routing based on urgency, auto-response for common issues.',
      'content-generation': 'Successful patterns: Schedule trigger for regular content, RSS feed for topic discovery, AI node for generation, multi-platform distribution nodes.',
      'marketing': 'Successful patterns: Webhook for campaign events, data enrichment nodes, audience segmentation, personalized content generation, performance tracking.',
      'social-media': 'Successful patterns: Schedule trigger for posting calendar, content queue management, engagement monitoring, response generation for comments.',
      'data-processing': 'Successful patterns: Webhook or schedule for data intake, validation nodes, transformation logic, database storage, notification on completion.',
      'competitive-intelligence': 'Successful patterns: Scheduled data collection, web scraping with respect to robots.txt, data aggregation, alert generation for significant changes.',
      'system-health': 'Successful patterns: Frequent health checks, threshold-based alerting, escalation procedures, automated recovery attempts.',
      'custom': 'General best practices: Clear trigger, modular node design, proper error handling, logging at key stages.',
    };
    
    return categoryGuidance[req.category] || categoryGuidance.custom;
  }

  // Utility to validate workflow JSON
  validateWorkflow(workflow: unknown): { valid: boolean; errors: string[] } {
    const result = N8nWorkflowSchema.safeParse(workflow);
    
    if (result.success) {
      return { valid: true, errors: [] };
    }
    
    return {
      valid: false,
      errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Generate workflow from template
  generateFromTemplate(
    templateName: string, 
    customizations: Record<string, any>
  ): N8nWorkflow {
    const templates: Record<string, N8nWorkflow> = {
      'webhook-to-slack': {
        id: crypto.randomUUID(),
        name: 'Webhook to Slack Notification',
        nodes: [
          {
            id: crypto.randomUUID(),
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [250, 300],
            parameters: {
              httpMethod: 'POST',
              path: 'notify',
              responseMode: 'responseNode',
            },
          },
          {
            id: crypto.randomUUID(),
            name: 'Format Message',
            type: 'n8n-nodes-base.set',
            position: [450, 300],
            parameters: {
              values: {
                string: [
                  {
                    name: 'message',
                    value: '={{ $json.body.message }}',
                  },
                ],
              },
            },
          },
          {
            id: crypto.randomUUID(),
            name: 'Send to Slack',
            type: 'n8n-nodes-base.slack',
            position: [650, 300],
            parameters: {
              channel: customizations.slackChannel || '#general',
              text: '={{ $json.message }}',
            },
          },
          {
            id: crypto.randomUUID(),
            name: 'Success Response',
            type: 'n8n-nodes-base.respondToWebhook',
            position: [850, 300],
            parameters: {
              statusCode: 200,
              body: '{"status": "sent"}',
            },
          },
        ],
        connections: {
          Webhook: [
            [{ node: 'Format Message', type: 'main', index: 0 }]
          ],
          'Format Message': [
            [{ node: 'Send to Slack', type: 'main', index: 0 }]
          ],
          'Send to Slack': [
            [{ node: 'Success Response', type: 'main', index: 0 }]
          ],
        },
      },
    };

    return templates[templateName] || templates['webhook-to-slack'];
  }
}

export const workflowGenerator = new WorkflowGenerator();
