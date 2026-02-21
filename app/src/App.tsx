import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/dashboard/Header';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder';
import { WorkflowLibrary } from '@/components/workflow/WorkflowLibrary';
import { KnowledgeBase } from '@/components/workflow/KnowledgeBase';
import { ExecutionMonitor } from '@/components/workflow/ExecutionMonitor';
import type { DashboardStats } from '@/types';

// Mock stats - in production, fetch from API
const mockStats: DashboardStats = {
  totalWorkflows: 24,
  deployedWorkflows: 18,
  successRate: 94.5,
  averageExecutionTime: 2.3,
  totalExecutions: 1247,
  aiCostToday: 18.45,
};

function App() {
  const [activeDeployment, setActiveDeployment] = useState<'mcp' | 'browser'>('mcp');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#0f172a',
            border: '1px solid #334155',
            color: '#f1f5f9',
          },
        }}
      />
      
      <Header 
        activeDeployment={activeDeployment} 
        onDeploymentChange={setActiveDeployment} 
      />

      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards stats={mockStats} />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-700 p-1">
            <TabsTrigger 
              value="builder" 
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400"
            >
              AI Builder
            </TabsTrigger>
            <TabsTrigger 
              value="library"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400"
            >
              Workflow Library
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400"
            >
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger 
              value="monitor"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400"
            >
              Live Monitor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-6">
            <WorkflowBuilder deploymentMode={activeDeployment} />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <WorkflowLibrary />
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeBase />
          </TabsContent>

          <TabsContent value="monitor" className="mt-6">
            <ExecutionMonitor />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div>
              n8n Agent Architect v1.0.0
            </div>
            <div className="flex items-center gap-4">
              <span>Deployment: {activeDeployment === 'mcp' ? 'MCP Bridge' : 'Browser Automation'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-green-400">● Connected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
