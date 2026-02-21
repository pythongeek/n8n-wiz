import { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, type Connection, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Loader2, 
  Wand2, 
  Play, 
  Save, 
  TestTube, 
  Code, 
  Eye,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Zap,
  Workflow
} from 'lucide-react';
import { workflowGenerator } from '@/lib/workflow-generator';
import { mcpDeployer } from '@/lib/deployers/mcp-deployer';
import { browserDeployer } from '@/lib/deployers/browser-deployer';
import type { N8nWorkflow, WorkflowCategory, DeploymentResult } from '@/types';

interface WorkflowBuilderProps {
  deploymentMode: 'mcp' | 'browser';
}

const nodeTypes: Record<string, string> = {
  'n8n-nodes-base.webhook': 'Webhook',
  'n8n-nodes-base.scheduleTrigger': 'Schedule',
  'n8n-nodes-base.httpRequest': 'HTTP Request',
  'n8n-nodes-base.set': 'Set Data',
  'n8n-nodes-base.code': 'Code',
  'n8n-nodes-base.if': 'IF',
  'n8n-nodes-base.slack': 'Slack',
  'n8n-nodes-base.postgres': 'Postgres',
  'n8n-nodes-base.noOp': 'No Operation',
};

const categories: { value: WorkflowCategory; label: string }[] = [
  { value: 'customer-support', label: 'Customer Support' },
  { value: 'content-generation', label: 'Content Generation' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'social-media', label: 'Social Media' },
  { value: 'data-processing', label: 'Data Processing' },
  { value: 'competitive-intelligence', label: 'Competitive Intelligence' },
  { value: 'system-health', label: 'System Health' },
  { value: 'custom', label: 'Custom' },
];

// Custom node type for ReactFlow
interface FlowNode extends Node {
  data: {
    label: string;
    type: string;
    params?: Record<string, any>;
    icon?: string;
  };
}

export function WorkflowBuilder({ deploymentMode }: WorkflowBuilderProps) {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<WorkflowCategory>('custom');
  const [preferredModel, setPreferredModel] = useState<'kimi' | 'gemini' | 'auto'>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflow, setWorkflow] = useState<N8nWorkflow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [activeTab, setActiveTab] = useState('visual');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const generateWorkflow = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a workflow description');
      return;
    }

    setIsGenerating(true);
    setDeploymentResult(null);

    try {
      const result = await workflowGenerator.generateWorkflow({
        prompt,
        category,
        preferredModel,
      });

      setWorkflow(result.workflow);
      convertToFlow(result.workflow);
      
      toast.success(`Workflow generated with ${result.modelUsed}`, {
        description: result.reasoning,
      });
    } catch (error) {
      toast.error('Generation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const convertToFlow = (wf: N8nWorkflow) => {
    // Convert n8n nodes to ReactFlow nodes
    const flowNodes: FlowNode[] = wf.nodes.map((n) => ({
      id: n.id,
      type: 'default',
      position: { x: n.position[0], y: n.position[1] },
      data: {
        label: n.name,
        type: n.type,
        params: n.parameters,
        icon: nodeTypes[n.type] || 'Node',
      },
      style: {
        background: getNodeColor(n.type),
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '150px',
      },
    }));

    // Convert n8n connections to ReactFlow edges
    const flowEdges: Edge[] = [];
    Object.entries(wf.connections).forEach(([source, targets]) => {
      targets[0]?.forEach((t, idx) => {
        flowEdges.push({
          id: `${source}-${t.node}-${idx}`,
          source,
          target: t.node,
          label: `output ${idx + 1}`,
          style: { stroke: '#64748b' },
          animated: true,
        });
      });
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const getNodeColor = (type: string): string => {
    if (type.includes('webhook') || type.includes('trigger')) return '#1e3a5f';
    if (type.includes('http') || type.includes('request')) return '#3f2e5f';
    if (type.includes('slack') || type.includes('email')) return '#1f3f2e';
    if (type.includes('if') || type.includes('switch')) return '#5f3f2e';
    if (type.includes('code')) return '#2e3f5f';
    return '#1e293b';
  };

  const deployWorkflow = async () => {
    if (!workflow) return;

    setIsDeploying(true);
    setDeploymentResult(null);

    try {
      const deployer = deploymentMode === 'mcp' ? mcpDeployer : browserDeployer;
      const result = await deployer.deploy(workflow);
      
      setDeploymentResult(result);

      if (result.success) {
        toast.success('Deployment successful!', {
          description: `Workflow ID: ${result.n8nWorkflowId}`,
        });
      } else {
        toast.error('Deployment failed', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('Deployment error', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const testWorkflow = async () => {
    if (!workflow || !deploymentResult?.n8nWorkflowId) {
      toast.error('Deploy workflow first');
      return;
    }

    toast.info('Running test...');
    
    try {
      const deployer = deploymentMode === 'mcp' ? mcpDeployer : browserDeployer;
      
      // Test execution is only available in browser deployer
      if ('testWorkflow' in deployer) {
        const result = await deployer.testWorkflow(deploymentResult.n8nWorkflowId);

        if (result.success) {
          toast.success('Test passed!', {
            description: `Duration: ${result.durationMs}ms`,
          });
        } else {
          toast.error('Test failed', {
            description: result.error,
          });
        }
      } else {
        toast.info('Test execution not available in MCP mode');
      }
    } catch (error) {
      toast.error('Test error', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const saveWorkflow = () => {
    if (!workflow) return;
    
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Workflow saved to file');
  };

  const resetBuilder = () => {
    setPrompt('');
    setWorkflow(null);
    setNodes([]);
    setEdges([]);
    setDeploymentResult(null);
    toast.info('Builder reset');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
      {/* Left Panel: Input & Controls */}
      <div className="space-y-4 overflow-y-auto">
        {/* Prompt Input */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              AI Workflow Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Describe Your Workflow</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Create a workflow that monitors RSS feeds for AI news, summarizes articles with Gemini, and posts to Slack..."
                className="min-h-[100px] bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as WorkflowCategory)}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-slate-100">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-400">AI Model</Label>
                <Select value={preferredModel} onValueChange={(v) => setPreferredModel(v as any)}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="auto" className="text-slate-100">Auto (Recommended)</SelectItem>
                    <SelectItem value="kimi" className="text-slate-100">Kimi 2.5 (Complex)</SelectItem>
                    <SelectItem value="gemini" className="text-slate-100">Gemini 2.5 (Fast)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateWorkflow}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Workflow
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Workflow Info */}
        {workflow && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-200">{workflow.name}</CardTitle>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                  v1
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950 rounded-lg p-2">
                  <div className="text-lg font-bold text-slate-200">{workflow.nodes.length}</div>
                  <div className="text-[10px] text-slate-500">Nodes</div>
                </div>
                <div className="bg-slate-950 rounded-lg p-2">
                  <div className="text-lg font-bold text-slate-200">
                    {Object.keys(workflow.connections).length}
                  </div>
                  <div className="text-[10px] text-slate-500">Connections</div>
                </div>
                <div className="bg-slate-950 rounded-lg p-2">
                  <div className="text-lg font-bold text-slate-200">
                    {preferredModel === 'auto' ? 'Auto' : preferredModel}
                  </div>
                  <div className="text-[10px] text-slate-500">Model</div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div className="flex gap-2">
                <Button
                  onClick={deployWorkflow}
                  disabled={isDeploying}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isDeploying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Deploy
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={testWorkflow}
                  disabled={!deploymentResult?.success}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <TestTube className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={saveWorkflow}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetBuilder}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {deploymentResult && (
                <div className={`p-3 rounded-lg ${
                  deploymentResult.success 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {deploymentResult.success ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm ${
                      deploymentResult.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {deploymentResult.message || deploymentResult.error}
                    </span>
                  </div>
                  {deploymentResult.n8nWorkflowId && (
                    <div className="mt-2 text-xs text-slate-500">
                      ID: {deploymentResult.n8nWorkflowId}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel: Visual Editor */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="bg-slate-800/50 border-b border-slate-700 rounded-none">
            <TabsTrigger value="visual" className="data-[state=active]:bg-slate-700">
              <Eye className="w-4 h-4 mr-2" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="json" className="data-[state=active]:bg-slate-700">
              <Code className="w-4 h-4 mr-2" />
              JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="flex-1 m-0 p-0">
            {nodes.length > 0 ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                className="bg-slate-950"
              >
                <Background color="#334155" gap={16} />
                <Controls className="bg-slate-800 border-slate-700" />
                <MiniMap 
                  className="bg-slate-800 border-slate-700" 
                  nodeColor={(node) => getNodeColor((node as FlowNode).data?.type as string)}
                />
              </ReactFlow>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Workflow className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Generate a workflow to see the visual editor</p>
                  <p className="text-sm mt-2">Enter a description and click Generate</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="json" className="flex-1 m-0 p-0">
            <pre className="h-full overflow-auto p-4 text-sm font-mono text-slate-300 bg-slate-950">
              {workflow ? JSON.stringify(workflow, null, 2) : '// Generate a workflow to see JSON'}
            </pre>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
