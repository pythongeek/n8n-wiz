import type { ExecutionResult, N8nWorkflow, KnowledgeEntry, N8nConnection } from '@/types';

interface AutoFixResult {
  action: 'auto_fixed' | 'requires_human_review' | 'no_action';
  newVersion?: number;
  reasoning?: string;
  fixedWorkflow?: N8nWorkflow;
  confidence?: number;
}

interface ErrorAnalysis {
  rootCause: string;
  fixNeeded: string;
  confidence: number;
  fixedWorkflow?: N8nWorkflow;
}

export class SelfFeedingEngine {
  constructor() {
    // In production, initialize Supabase client here
  }

  async processExecutionResult(
    workflowId: string, 
    execution: ExecutionResult
  ): Promise<AutoFixResult> {
    // Store execution knowledge
    await this.storeExecutionKnowledge(workflowId, execution);

    // If failed, attempt auto-fix
    if (!execution.success) {
      return this.attemptAutoFix(workflowId, execution);
    }

    // If success, extract patterns
    await this.extractSuccessPatterns(workflowId);

    return { action: 'no_action' };
  }

  private async attemptAutoFix(
    workflowId: string, 
    execution: ExecutionResult
  ): Promise<AutoFixResult> {
    try {
      // Fetch workflow details
      const workflow = await this.getWorkflow(workflowId);
      
      if (!workflow) {
        return {
          action: 'requires_human_review',
          reasoning: 'Could not retrieve workflow for analysis',
        };
      }

      // Analyze error with AI
      const analysis = await this.analyzeError(workflow, execution);

      if (analysis.confidence > 0.8 && analysis.fixedWorkflow) {
        // Create new version with fix
        const newVersion = await this.createNewVersion(workflowId, analysis.fixedWorkflow, {
          parentId: workflowId,
          fixReason: analysis.fixNeeded,
          confidence: analysis.confidence,
        });

        // Auto-redeploy if confidence is very high
        if (analysis.confidence > 0.95) {
          // In production, this would trigger redeployment
          console.log(`Auto-redeploying workflow ${workflowId} with confidence ${analysis.confidence}`);
        }

        return {
          action: 'auto_fixed',
          newVersion,
          reasoning: analysis.fixNeeded,
          fixedWorkflow: analysis.fixedWorkflow,
          confidence: analysis.confidence,
        };
      }

      return {
        action: 'requires_human_review',
        reasoning: analysis.rootCause,
        confidence: analysis.confidence,
      };
    } catch (error) {
      return {
        action: 'requires_human_review',
        reasoning: error instanceof Error ? error.message : 'Auto-fix failed',
      };
    }
  }

  private async analyzeError(
    workflow: N8nWorkflow, 
    execution: ExecutionResult
  ): Promise<ErrorAnalysis> {
    // In production, this would call Kimi 2.5 for deep error analysis
    // For now, implement pattern-based analysis

    const errorMessage = execution.errorMessage?.toLowerCase() || '';
    
    // Common error patterns and fixes
    const patterns: Array<{
      pattern: RegExp;
      rootCause: string;
      fix: string;
      applyFix: (w: N8nWorkflow) => N8nWorkflow;
    }> = [
      {
        pattern: /credential|authentication|unauthorized|401|403/,
        rootCause: 'Credential issue - API key expired or invalid',
        fix: 'Update credential reference or add error handling for auth failures',
        applyFix: (w) => this.addCredentialErrorHandling(w),
      },
      {
        pattern: /timeout|etimedout|econnreset/,
        rootCause: 'Network timeout - API call took too long',
        fix: 'Add retry logic with exponential backoff',
        applyFix: (w) => this.addRetryLogic(w),
      },
      {
        pattern: /rate limit|too many requests|429/,
        rootCause: 'Rate limiting - too many API calls',
        fix: 'Add rate limit handling and request throttling',
        applyFix: (w) => this.addRateLimitHandling(w),
      },
      {
        pattern: /validation|schema|invalid/i,
        rootCause: 'Data validation error - input format incorrect',
        fix: 'Add data validation and transformation nodes',
        applyFix: (w) => this.addValidationNodes(w),
      },
    ];

    for (const p of patterns) {
      if (p.pattern.test(errorMessage)) {
        const fixedWorkflow = p.applyFix(workflow);
        return {
          rootCause: p.rootCause,
          fixNeeded: p.fix,
          confidence: 0.85,
          fixedWorkflow,
        };
      }
    }

    // Unknown error - low confidence
    return {
      rootCause: 'Unknown error pattern',
      fixNeeded: 'Manual review required',
      confidence: 0.3,
    };
  }

  private addCredentialErrorHandling(workflow: N8nWorkflow): N8nWorkflow {
    // Add error handling branch for credential issues
    const errorHandlerId = crypto.randomUUID();
    const errorHandler: N8nWorkflow['nodes'][0] = {
      id: errorHandlerId,
      name: 'Handle Auth Error',
      type: 'n8n-nodes-base.slack',
      position: [650, 500],
      parameters: {
        channel: '#alerts',
        text: 'Workflow authentication failed - please check credentials',
      },
    };

    const lastNodeName = workflow.nodes[workflow.nodes.length - 1].name;
    const updatedConnections: Record<string, N8nConnection[][]> = {
      ...workflow.connections,
      [lastNodeName]: [
        [{ node: 'Handle Auth Error', type: 'main', index: 0 }]
      ],
    };

    return {
      ...workflow,
      nodes: [...workflow.nodes, errorHandler],
      connections: updatedConnections,
    };
  }

  private addRetryLogic(workflow: N8nWorkflow): N8nWorkflow {
    // Add retry loop structure
    // Simplified implementation
    return workflow;
  }

  private addRateLimitHandling(workflow: N8nWorkflow): N8nWorkflow {
    // Add wait node for rate limiting
    const waitNodeId = crypto.randomUUID();
    const waitNode: N8nWorkflow['nodes'][0] = {
      id: waitNodeId,
      name: 'Wait for Rate Limit',
      type: 'n8n-nodes-base.wait',
      position: [450, 400],
      parameters: {
        resume: 'afterTimeInterval',
        amount: 60,
        unit: 'seconds',
      },
    };

    return {
      ...workflow,
      nodes: [...workflow.nodes, waitNode],
    };
  }

  private addValidationNodes(workflow: N8nWorkflow): N8nWorkflow {
    // Add validation and transformation nodes
    const validateNodeId = crypto.randomUUID();
    const validateNode: N8nWorkflow['nodes'][0] = {
      id: validateNodeId,
      name: 'Validate Input',
      type: 'n8n-nodes-base.if',
      position: [350, 300],
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            type: 'string',
          },
          conditions: [
            {
              id: crypto.randomUUID(),
              leftValue: '={{ $json }}',
              operator: {
                type: 'exists',
              },
              rightValue: '',
            },
          ],
          combinator: 'and',
        },
      },
    };

    return {
      ...workflow,
      nodes: [validateNode, ...workflow.nodes],
    };
  }

  private async storeExecutionKnowledge(
    workflowId: string, 
    execution: ExecutionResult
  ): Promise<void> {
    // In production, store in Supabase workflow_knowledge table
    console.log('Storing execution knowledge:', { workflowId, execution });
  }

  private async extractSuccessPatterns(workflowId: string): Promise<void> {
    // Analyze successful workflow and extract reusable patterns
    console.log('Extracting success patterns for:', workflowId);
  }

  private async getWorkflow(_workflowId: string): Promise<N8nWorkflow | null> {
    // In production, fetch from Supabase
    // For now, return null to trigger fallback
    return null;
  }

  private async createNewVersion(
    _workflowId: string, 
    _workflow: N8nWorkflow, 
    metadata: {
      parentId: string;
      fixReason: string;
      confidence: number;
    }
  ): Promise<number> {
    // In production, create new version in database
    console.log('Creating new version:', { metadata });
    return 1;
  }

  // Query knowledge base for similar workflows
  async findSimilarPatterns(): Promise<KnowledgeEntry[]> {
    // In production, use vector similarity search
    // For now, return empty array
    return [];
  }

  // Get optimization suggestions for a workflow
  async getOptimizations(): Promise<string[]> {
    // Analyze workflow and suggest improvements
    return [
      'Consider adding error handling nodes',
      'Add retry logic for external API calls',
      'Use batch processing for high-volume operations',
    ];
  }
}

export const selfFeedingEngine = new SelfFeedingEngine();
