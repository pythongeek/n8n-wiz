import type { N8nWorkflow, DeploymentResult, TestResult } from '@/types';

interface BrowserAction {
  type: 'navigate' | 'click' | 'fill' | 'wait' | 'evaluate' | 'screenshot' | 'waitForSelector' | 'selectOption' | 'press';
  selector?: string;
  value?: string;
  timeout?: number;
  storeAs?: string;
}

export class BrowserDeployer {
  private automationUrl: string;
  private secret: string;

  constructor() {
    this.automationUrl = import.meta.env.VITE_BROWSER_AUTOMATION_URL || '';
    this.secret = import.meta.env.VITE_BROWSER_SECRET || '';
  }

  async deploy(workflow: N8nWorkflow): Promise<DeploymentResult> {
    if (!this.automationUrl) {
      return {
        success: false,
        method: 'browser-automation',
        error: 'Browser automation URL not configured. Set VITE_BROWSER_AUTOMATION_URL in environment.',
      };
    }

    try {
      // Execute browser automation sequence
      const result = await this.executeBrowserSequence([
        { type: 'navigate', value: `${this.getN8nUrl()}/workflow/new` },
        { type: 'wait', timeout: 3000 },
        { type: 'click', selector: '[data-test-id="workflow-menu"]' },
        { type: 'click', selector: 'text=Import from JSON' },
        { 
          type: 'fill', 
          selector: '[data-test-id="import-json-input"]', 
          value: JSON.stringify(workflow, null, 2) 
        },
        { type: 'click', selector: '[data-test-id="import-json-button"]' },
        { type: 'wait', timeout: 2000 },
        { type: 'evaluate', value: '() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true })); }' },
        { type: 'wait', timeout: 1500 },
        { 
          type: 'evaluate', 
          value: `() => { return window.location.pathname.match(/workflow\/([a-zA-Z0-9-]+)/)?.[1]; }`,
          storeAs: 'workflowId'
        },
      ]);

      if (!result.success) {
        return {
          success: false,
          method: 'browser-automation',
          error: result.error,
        };
      }

      const workflowId = result.data?.workflowId;

      // Activate if settings indicate it should be active
      if (workflow.settings?.executionOrder) {
        await this.executeBrowserSequence([
          { type: 'navigate', value: `${this.getN8nUrl()}/workflow/${workflowId}` },
          { type: 'wait', timeout: 2000 },
          { type: 'click', selector: '[data-test-id="workflow-activate-button"]' },
          { type: 'wait', timeout: 1000 },
        ]);
      }

      return {
        success: true,
        method: 'browser-automation',
        n8nWorkflowId: workflowId,
        message: `Workflow "${workflow.name}" deployed via browser automation`,
      };
    } catch (error) {
      return {
        success: false,
        method: 'browser-automation',
        error: error instanceof Error ? error.message : 'Browser automation failed',
      };
    }
  }

  async testWorkflow(workflowId: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.executeBrowserSequence([
        { type: 'navigate', value: `${this.getN8nUrl()}/workflow/${workflowId}` },
        { type: 'wait', timeout: 3000 },
        { type: 'click', selector: '[data-test-id="execute-workflow-button"]' },
        { type: 'wait', timeout: 60000 }, // Wait for execution
        { 
          type: 'evaluate', 
          value: `() => {
            const executionData = document.querySelector('[data-test-id="execution-data"]');
            return executionData ? executionData.textContent : null;
          }`,
          storeAs: 'executionData'
        },
      ]);

      const durationMs = Date.now() - startTime;

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          durationMs,
        };
      }

      // Parse execution results
      let executionData = null;
      try {
        executionData = JSON.parse(result.data?.executionData || '{}');
      } catch {
        executionData = { raw: result.data?.executionData };
      }

      return {
        success: true,
        executionData,
        durationMs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test execution failed',
        durationMs: Date.now() - startTime,
      };
    }
  }

  async updateWorkflow(workflowId: string, updates: Partial<N8nWorkflow>): Promise<DeploymentResult> {
    try {
      // Navigate to workflow and update
      await this.executeBrowserSequence([
        { type: 'navigate', value: `${this.getN8nUrl()}/workflow/${workflowId}` },
        { type: 'wait', timeout: 3000 },
        { type: 'click', selector: '[data-test-id="workflow-menu"]' },
        { type: 'click', selector: 'text=Import from JSON' },
        { 
          type: 'fill', 
          selector: '[data-test-id="import-json-input"]', 
          value: JSON.stringify(updates, null, 2) 
        },
        { type: 'click', selector: '[data-test-id="import-json-button"]' },
        { type: 'wait', timeout: 2000 },
        { type: 'evaluate', value: '() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true })); }' },
        { type: 'wait', timeout: 1500 },
      ]);

      return {
        success: true,
        method: 'browser-automation',
        n8nWorkflowId: workflowId,
        message: 'Workflow updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        method: 'browser-automation',
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  async deleteWorkflow(workflowId: string): Promise<boolean> {
    try {
      await this.executeBrowserSequence([
        { type: 'navigate', value: `${this.getN8nUrl()}/workflow/${workflowId}` },
        { type: 'wait', timeout: 2000 },
        { type: 'click', selector: '[data-test-id="workflow-menu"]' },
        { type: 'click', selector: 'text=Delete' },
        { type: 'click', selector: '[data-test-id="confirm-delete-button"]' },
        { type: 'wait', timeout: 1000 },
      ]);
      return true;
    } catch {
      return false;
    }
  }

  async takeScreenshot(workflowId?: string): Promise<string | null> {
    try {
      const url = workflowId 
        ? `${this.getN8nUrl()}/workflow/${workflowId}` 
        : this.getN8nUrl();

      const result = await this.executeBrowserSequence([
        { type: 'navigate', value: url },
        { type: 'wait', timeout: 3000 },
        { type: 'screenshot' },
      ]);

      return result.data?.screenshot || null;
    } catch {
      return null;
    }
  }

  private async executeBrowserSequence(actions: BrowserAction[]): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const response = await fetch(`${this.automationUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret': this.secret,
      },
      body: JSON.stringify({ actions }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browser automation error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  private getN8nUrl(): string {
    return import.meta.env.VITE_N8N_PUBLIC_URL || 'https://n8n.yourdomain.com';
  }

  // Health check for browser automation service
  async healthCheck(): Promise<{ healthy: boolean; latency: number; message: string }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.automationUrl}/health`, {
        method: 'GET',
        headers: {
          'X-Secret': this.secret,
        },
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          healthy: true,
          latency,
          message: 'Browser automation service is healthy',
        };
      }

      return {
        healthy: false,
        latency,
        message: `Browser service returned ${response.status}`,
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

export const browserDeployer = new BrowserDeployer();
