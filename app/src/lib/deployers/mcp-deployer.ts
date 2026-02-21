import type { N8nWorkflow, DeploymentResult, TestResult } from '@/types';

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class MCPDeployer {
  private serverUrl: string;
  private apiKey: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_MCP_SERVER_URL || '';
    this.apiKey = import.meta.env.VITE_MCP_API_KEY || '';
  }

  async deploy(workflow: N8nWorkflow): Promise<DeploymentResult> {
    if (!this.serverUrl) {
      return {
        success: false,
        method: 'mcp',
        error: 'MCP server URL not configured. Set VITE_MCP_SERVER_URL in environment.',
      };
    }

    try {
      // Step 1: Create workflow
      const createResult = await this.callTool('create_workflow', {
        name: workflow.name,
        workflow: workflow,
      });

      if (!createResult.success) {
        return {
          success: false,
          method: 'mcp',
          error: `Failed to create workflow: ${createResult.error}`,
        };
      }

      const workflowId = createResult.data?.id;

      // Step 2: Activate workflow
      const activateResult = await this.callTool('activate_workflow', {
        id: workflowId,
      });

      if (!activateResult.success) {
        // Try to clean up the created workflow
        await this.callTool('delete_workflow', { id: workflowId });
        
        return {
          success: false,
          method: 'mcp',
          error: `Failed to activate workflow: ${activateResult.error}`,
        };
      }

      return {
        success: true,
        method: 'mcp',
        n8nWorkflowId: workflowId,
        message: `Workflow "${workflow.name}" deployed and activated via MCP bridge`,
      };
    } catch (error) {
      return {
        success: false,
        method: 'mcp',
        error: error instanceof Error ? error.message : 'Unknown MCP deployment error',
      };
    }
  }

  async update(workflowId: string, updates: Partial<N8nWorkflow>): Promise<DeploymentResult> {
    try {
      const result = await this.callTool('update_workflow', {
        id: workflowId,
        workflow: updates,
      });

      if (!result.success) {
        return {
          success: false,
          method: 'mcp',
          error: `Update failed: ${result.error}`,
        };
      }

      return {
        success: true,
        method: 'mcp',
        n8nWorkflowId: workflowId,
        message: 'Workflow updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        method: 'mcp',
        error: error instanceof Error ? error.message : 'Unknown update error',
      };
    }
  }

  async execute(workflowId: string, data?: any): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.callTool('execute_workflow', {
        id: workflowId,
        data,
      });

      const durationMs = Date.now() - startTime;

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          durationMs,
        };
      }

      return {
        success: true,
        executionData: result.data,
        durationMs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        durationMs: Date.now() - startTime,
      };
    }
  }

  async deactivate(workflowId: string): Promise<boolean> {
    try {
      const result = await this.callTool('deactivate_workflow', { id: workflowId });
      return result.success;
    } catch {
      return false;
    }
  }

  async delete(workflowId: string): Promise<boolean> {
    try {
      // First deactivate
      await this.deactivate(workflowId);
      
      // Then delete
      const result = await this.callTool('delete_workflow', { id: workflowId });
      return result.success;
    } catch {
      return false;
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<{
    active: boolean;
    lastExecuted?: string;
    executionCount?: number;
  } | null> {
    try {
      const result = await this.callTool('get_workflow_status', { id: workflowId });
      
      if (!result.success) {
        return null;
      }

      return {
        active: result.data.active,
        lastExecuted: result.data.lastExecuted,
        executionCount: result.data.executionCount,
      };
    } catch {
      return null;
    }
  }

  async listWorkflows(): Promise<Array<{
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  }>> {
    try {
      const result = await this.callTool('list_workflows', {});
      
      if (!result.success) {
        return [];
      }

      return result.data.workflows || [];
    } catch {
      return [];
    }
  }

  private async callTool(tool: string, params: Record<string, any>): Promise<MCPResponse> {
    const response = await fetch(`${this.serverUrl}/mcp/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({ tool, params }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP server error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Health check for MCP server
  async healthCheck(): Promise<{ healthy: boolean; latency: number; message: string }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          healthy: true,
          latency,
          message: 'MCP server is healthy',
        };
      }

      return {
        healthy: false,
        latency,
        message: `MCP server returned ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}

export const mcpDeployer = new MCPDeployer();
