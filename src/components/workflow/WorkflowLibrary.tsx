import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Play,
  Pause,
  Trash2,
  Copy,
  Edit,
  MoreVertical,
  Clock,
  RotateCcw,
  GitBranch,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WorkflowRecord, WorkflowStatus, WorkflowCategory } from '@/types';

// Mock data - in production, fetch from Supabase
const mockWorkflows: WorkflowRecord[] = [
  {
    id: '1',
    user_id: 'user1',
    name: 'Customer Support Bot',
    description: 'Auto-responds to common customer inquiries',
    category: 'customer-support',
    tags: ['slack', 'ai', 'support'],
    workflow_json: {} as any,
    original_prompt: 'Create a customer support bot',
    ai_model_used: 'kimi-2.5',
    status: 'deployed',
    n8n_workflow_id: 'wf_123',
    deployment_method: 'mcp',
    version: 3,
    is_latest: true,
    iteration_count: 2,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    name: 'Content Generator',
    description: 'Generates blog posts from RSS feeds',
    category: 'content-generation',
    tags: ['rss', 'gemini', 'wordpress'],
    workflow_json: {} as any,
    original_prompt: 'Create a content generation pipeline',
    ai_model_used: 'gemini-2.5-pro',
    status: 'testing',
    n8n_workflow_id: 'wf_124',
    deployment_method: 'browser-automation',
    version: 1,
    is_latest: true,
    iteration_count: 0,
    created_at: '2024-01-18T09:00:00Z',
    updated_at: '2024-01-18T09:00:00Z',
  },
  {
    id: '3',
    user_id: 'user1',
    name: 'Marketing Campaign Tracker',
    description: 'Tracks ad performance across platforms',
    category: 'marketing',
    tags: ['meta', 'google-ads', 'analytics'],
    workflow_json: {} as any,
    original_prompt: 'Track marketing campaigns',
    ai_model_used: 'kimi-2.5',
    status: 'draft',
    version: 1,
    is_latest: true,
    iteration_count: 0,
    created_at: '2024-01-19T11:00:00Z',
    updated_at: '2024-01-19T11:00:00Z',
  },
  {
    id: '4',
    user_id: 'user1',
    name: 'Social Media Scheduler',
    description: 'Schedules posts across social platforms',
    category: 'social-media',
    tags: ['twitter', 'linkedin', 'buffer'],
    workflow_json: {} as any,
    original_prompt: 'Schedule social media posts',
    ai_model_used: 'gemini-2.5-flash',
    status: 'deployed',
    n8n_workflow_id: 'wf_125',
    deployment_method: 'mcp',
    version: 2,
    is_latest: true,
    iteration_count: 1,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-16T16:00:00Z',
  },
  {
    id: '5',
    user_id: 'user1',
    name: 'Data Pipeline',
    description: 'Processes and transforms data from S3',
    category: 'data-processing',
    tags: ['s3', 'postgres', 'etl'],
    workflow_json: {} as any,
    original_prompt: 'Create a data processing pipeline',
    ai_model_used: 'kimi-2.5',
    status: 'failed',
    version: 1,
    is_latest: true,
    iteration_count: 0,
    created_at: '2024-01-17T13:00:00Z',
    updated_at: '2024-01-17T13:00:00Z',
  },
];

const statusColors: Record<WorkflowStatus, string> = {
  draft: 'bg-slate-500',
  testing: 'bg-amber-500',
  deployed: 'bg-green-500',
  failed: 'bg-red-500',
  archived: 'bg-gray-500',
};

const categoryLabels: Record<WorkflowCategory, string> = {
  'customer-support': 'Customer Support',
  'content-generation': 'Content Generation',
  'marketing': 'Marketing',
  'social-media': 'Social Media',
  'data-processing': 'Data Processing',
  'competitive-intelligence': 'Competitive Intelligence',
  'system-health': 'System Health',
  'custom': 'Custom',
};

export function WorkflowLibrary() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>(mockWorkflows);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkflowStatus | 'all'>('all');

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch = 
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || wf.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleActivate = () => {
    toast.success('Workflow activated');
  };

  const handleDeactivate = () => {
    toast.info('Workflow deactivated');
  };

  const handleDelete = (id: string) => {
    setWorkflows(workflows.filter(w => w.id !== id));
    toast.success('Workflow deleted');
  };

  const handleDuplicate = (workflow: WorkflowRecord) => {
    const newWorkflow = {
      ...workflow,
      id: crypto.randomUUID(),
      name: `${workflow.name} (Copy)`,
      status: 'draft' as WorkflowStatus,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setWorkflows([newWorkflow, ...workflows]);
    toast.success('Workflow duplicated');
  };

  const handleRetry = () => {
    toast.info('Retrying deployment...');
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
            </div>
            
            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <TabsList className="bg-slate-950 border border-slate-700">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="deployed" className="text-xs">Deployed</TabsTrigger>
                <TabsTrigger value="testing" className="text-xs">Testing</TabsTrigger>
                <TabsTrigger value="draft" className="text-xs">Draft</TabsTrigger>
                <TabsTrigger value="failed" className="text-xs">Failed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold text-slate-200 truncate">
                    {workflow.name}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {workflow.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                    <DropdownMenuItem 
                      className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                      onClick={() => handleDuplicate(workflow)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {workflow.status === 'deployed' ? (
                      <DropdownMenuItem 
                        className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        onClick={handleDeactivate}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        onClick={handleActivate}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Activate
                      </DropdownMenuItem>
                    )}
                    {workflow.status === 'failed' && (
                      <DropdownMenuItem 
                        className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        onClick={handleRetry}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry Deploy
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem 
                      className="text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer"
                      onClick={() => handleDelete(workflow.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mb-3">
                <Badge 
                  variant="secondary" 
                  className={`${statusColors[workflow.status]} text-white text-[10px]`}
                >
                  {workflow.status}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                  {categoryLabels[workflow.category]}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                  v{workflow.version}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {workflow.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="text-[10px] px-2 py-0.5 bg-slate-800 rounded-full text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(workflow.updated_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {workflow.iteration_count} iterations
                </div>
              </div>

              {workflow.n8n_workflow_id && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] ${
                        workflow.deployment_method === 'mcp' 
                          ? 'border-blue-500/30 text-blue-400' 
                          : 'border-purple-500/30 text-purple-400'
                      }`}
                    >
                      {workflow.deployment_method}
                    </Badge>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {workflow.n8n_workflow_id}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-500">No workflows match your filters</p>
          <Button 
            variant="outline" 
            className="mt-4 border-slate-700"
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
