import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Server,
  Globe,
  Cpu,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import type { ExecutionLog } from '@/types';

// Mock execution data
const mockExecutions: ExecutionLog[] = [
  {
    id: '1',
    workflow_id: 'wf_123',
    n8n_execution_id: 'exec_001',
    status: 'success',
    duration_ms: 2450,
    created_at: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    workflow_id: 'wf_124',
    n8n_execution_id: 'exec_002',
    status: 'error',
    error_message: 'Rate limit exceeded from Gemini API',
    duration_ms: 3200,
    created_at: '2024-01-20T10:28:00Z',
  },
  {
    id: '3',
    workflow_id: 'wf_125',
    n8n_execution_id: 'exec_003',
    status: 'success',
    duration_ms: 1800,
    created_at: '2024-01-20T10:25:00Z',
  },
  {
    id: '4',
    workflow_id: 'wf_123',
    n8n_execution_id: 'exec_004',
    status: 'success',
    duration_ms: 2100,
    created_at: '2024-01-20T10:22:00Z',
  },
  {
    id: '5',
    workflow_id: 'wf_126',
    n8n_execution_id: 'exec_005',
    status: 'waiting',
    created_at: '2024-01-20T10:20:00Z',
  },
];

// Mock metrics data
const executionTrendData = [
  { time: '00:00', executions: 12, errors: 1 },
  { time: '04:00', executions: 8, errors: 0 },
  { time: '08:00', executions: 24, errors: 2 },
  { time: '12:00', executions: 45, errors: 3 },
  { time: '16:00', executions: 38, errors: 1 },
  { time: '20:00', executions: 28, errors: 2 },
  { time: '23:59', executions: 15, errors: 0 },
];

const latencyData = [
  { time: '00:00', p50: 1200, p95: 3200, p99: 4500 },
  { time: '04:00', p50: 1100, p95: 2800, p99: 3800 },
  { time: '08:00', p50: 1500, p95: 4200, p99: 5800 },
  { time: '12:00', p50: 1800, p95: 4800, p99: 6500 },
  { time: '16:00', p50: 1600, p95: 4100, p99: 5200 },
  { time: '20:00', p50: 1400, p95: 3500, p99: 4800 },
  { time: '23:59', p50: 1300, p95: 3100, p99: 4200 },
];

const modelUsageData = [
  { name: 'Kimi 2.5', requests: 145, cost: 12.45 },
  { name: 'Gemini Pro', requests: 234, cost: 8.92 },
  { name: 'Gemini Flash', requests: 567, cost: 3.21 },
];

export function ExecutionMonitor() {
  const [activeTab, setActiveTab] = useState('live');
  const [isLive, setIsLive] = useState(true);
  const [executions] = useState<ExecutionLog[]>(mockExecutions);

  const getStatusIcon = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: ExecutionLog['status']) => {
    const colors = {
      success: 'bg-green-500/20 text-green-400 border-green-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      waiting: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400';
  };

  const successRate = Math.round(
    (executions.filter(e => e.status === 'success').length / executions.length) * 100
  );

  const avgDuration = Math.round(
    executions
      .filter(e => e.duration_ms)
      .reduce((acc, e) => acc + (e.duration_ms || 0), 0) / 
    executions.filter(e => e.duration_ms).length / 1000
  );

  return (
    <div className="space-y-4">
      {/* Live Status Bar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-sm font-medium text-slate-200">
                  {isLive ? 'Live Monitoring' : 'Paused'}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Server className="w-4 h-4" />
                <span>n8n: Connected</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Globe className="w-4 h-4" />
                <span>MCP: Healthy</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Cpu className="w-4 h-4" />
                <span>Browser: Standby</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLive(!isLive)}
                className="border-slate-700"
              >
                {isLive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isLive ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-200">{executions.length}</div>
                <div className="text-xs text-slate-500">Active Executions</div>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400">{successRate}%</div>
                <div className="text-xs text-slate-500">Success Rate</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-200">{avgDuration}s</div>
                <div className="text-xs text-slate-500">Avg Duration</div>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-400">946</div>
                <div className="text-xs text-slate-500">Total Today</div>
              </div>
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="live" className="data-[state=active]:bg-slate-800">
            <Activity className="w-4 h-4 mr-2" />
            Live Feed
          </TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-slate-800">
            <BarChart3 className="w-4 h-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-slate-800">
            <Terminal className="w-4 h-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-200">
                Recent Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-3 bg-slate-950 rounded-lg hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(execution.status)}
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {execution.workflow_id}
                          </div>
                          <div className="text-xs text-slate-500">
                            {execution.n8n_execution_id}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {execution.duration_ms && (
                          <div className="text-right">
                            <div className="text-sm text-slate-300">
                              {(execution.duration_ms / 1000).toFixed(2)}s
                            </div>
                            <div className="text-xs text-slate-500">Duration</div>
                          </div>
                        )}
                        
                        <Badge variant="outline" className={getStatusBadge(execution.status)}>
                          {execution.status}
                        </Badge>
                        
                        <div className="text-xs text-slate-500 w-16 text-right">
                          {new Date(execution.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-200">
                  Execution Volume (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={executionTrendData}>
                      <defs>
                        <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="executions" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorExec)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="errors" 
                        stroke="#ef4444" 
                        fillOpacity={1} 
                        fill="url(#colorError)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-200">
                  Latency Percentiles (ms)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={latencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Line type="monotone" dataKey="p50" stroke="#22c55e" strokeWidth={2} name="p50" />
                      <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} name="p95" />
                      <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} name="p99" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-200">
                  AI Model Usage & Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelUsageData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#64748b" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
                      <Bar dataKey="cost" fill="#10b981" name="Cost ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-200">
                System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex gap-2">
                    <span className="text-slate-500">[10:30:15]</span>
                    <span className="text-green-400">INFO</span>
                    <span className="text-slate-300">Workflow wf_123 executed successfully in 2450ms</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">[10:28:42]</span>
                    <span className="text-red-400">ERROR</span>
                    <span className="text-slate-300">Workflow wf_124 failed: Rate limit exceeded from Gemini API</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">[10:28:40]</span>
                    <span className="text-amber-400">WARN</span>
                    <span className="text-slate-300">Retrying Gemini API call (attempt 2/3)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">[10:25:18]</span>
                    <span className="text-green-400">INFO</span>
                    <span className="text-slate-300">Workflow wf_125 executed successfully in 1800ms</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">[10:22:05]</span>
                    <span className="text-green-400">INFO</span>
                    <span className="text-slate-300">Workflow wf_123 executed successfully in 2100ms</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">[10:20:00]</span>
                    <span className="text-blue-400">DEBUG</span>
                    <span className="text-slate-300">Webhook received: /webhook/customer-support</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">[10:15:30]</span>
                    <span className="text-green-400">INFO</span>
                    <span className="text-slate-300">MCP bridge health check: OK (latency: 45ms)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">[10:10:00]</span>
                    <span className="text-purple-400">AUTO-FIX</span>
                    <span className="text-slate-300">Applied retry logic to Data Pipeline workflow</span>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
