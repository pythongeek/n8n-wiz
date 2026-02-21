import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Brain,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  GitBranch,
} from 'lucide-react';
import type { KnowledgeEntry } from '@/types';

// Mock knowledge entries
const mockKnowledge: KnowledgeEntry[] = [
  {
    id: '1',
    workflow_id: 'wf_123',
    pattern_type: 'success_pattern',
    context: 'Customer support bot with sentiment analysis',
    workflow_structure: { nodes: ['webhook', 'sentiment', 'if', 'slack'] },
    outcome: 'success',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    workflow_id: 'wf_124',
    pattern_type: 'error_pattern',
    context: 'RSS feed processing with rate limiting',
    workflow_structure: { nodes: ['rss', 'http', 'gemini'] },
    outcome: 'failure',
    error_logs: 'Rate limit exceeded: 429 Too Many Requests',
    created_at: '2024-01-16T14:00:00Z',
  },
  {
    id: '3',
    workflow_id: 'wf_125',
    pattern_type: 'optimization',
    context: 'Social media scheduling with batch processing',
    workflow_structure: { nodes: ['schedule', 'batch', 'twitter', 'linkedin'] },
    outcome: 'success',
    created_at: '2024-01-17T09:00:00Z',
  },
];

const insights = [
  {
    title: 'Error Handling Best Practice',
    description: 'Workflows with explicit error handling nodes show 85% fewer failures.',
    type: 'best-practice',
    confidence: 0.92,
  },
  {
    title: 'Rate Limit Pattern',
    description: 'Adding 1-second delays between API calls reduces rate limit errors by 90%.',
    type: 'optimization',
    confidence: 0.88,
  },
  {
    title: 'Model Selection',
    description: 'Kimi 2.5 performs better for complex reasoning tasks (>1000 tokens).',
    type: 'insight',
    confidence: 0.85,
  },
  {
    title: 'Webhook Timeout',
    description: 'Setting webhook response timeout to 8s prevents Vercel function timeouts.',
    type: 'best-practice',
    confidence: 0.95,
  },
];

const recentFixes = [
  {
    workflow: 'Data Pipeline',
    issue: 'S3 connection timeout',
    fix: 'Added retry logic with exponential backoff',
    autoApplied: true,
    timestamp: '2024-01-20T10:30:00Z',
  },
  {
    workflow: 'Marketing Tracker',
    issue: 'Missing error handling for 404 responses',
    fix: 'Added IF node to check response status',
    autoApplied: true,
    timestamp: '2024-01-19T16:45:00Z',
  },
  {
    workflow: 'Content Generator',
    issue: 'Gemini API rate limiting',
    fix: 'Implemented request queue with 1s delays',
    autoApplied: false,
    timestamp: '2024-01-18T11:20:00Z',
  },
];

export function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('patterns');

  const filteredKnowledge = mockKnowledge.filter((k) =>
    k.context.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPatternIcon = (type: KnowledgeEntry['pattern_type']) => {
    switch (type) {
      case 'success_pattern':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error_pattern':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'optimization':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      default:
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getPatternColor = (type: KnowledgeEntry['pattern_type']) => {
    switch (type) {
      case 'success_pattern':
        return 'border-green-500/30 bg-green-500/5';
      case 'error_pattern':
        return 'border-red-500/30 bg-red-500/5';
      case 'optimization':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-700 text-slate-100"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="patterns" className="data-[state=active]:bg-slate-800">
            <Brain className="w-4 h-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-slate-800">
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="fixes" className="data-[state=active]:bg-slate-800">
            <Zap className="w-4 h-4 mr-2" />
            Auto-Fixes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKnowledge.map((entry) => (
              <Card 
                key={entry.id} 
                className={`bg-slate-900 border ${getPatternColor(entry.pattern_type)}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {getPatternIcon(entry.pattern_type)}
                    <CardTitle className="text-sm font-medium text-slate-200">
                      {entry.pattern_type.replace('_', ' ').toUpperCase()}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-300 mb-3">{entry.context}</p>
                  
                  <div className="bg-slate-950 rounded-lg p-2 mb-3">
                    <pre className="text-xs text-slate-500 overflow-x-auto">
                      {JSON.stringify(entry.workflow_structure, null, 2)}
                    </pre>
                  </div>

                  {entry.error_logs && (
                    <div className="flex items-start gap-2 p-2 bg-red-500/10 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                      <p className="text-xs text-red-400">{entry.error_logs}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <span>Workflow: {entry.workflow_id}</span>
                    <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredKnowledge.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-500">No patterns found matching your search</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, idx) => (
              <Card key={idx} className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <CardTitle className="text-sm font-medium text-slate-200">
                        {insight.title}
                      </CardTitle>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] border-slate-700 text-slate-400"
                    >
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-400">{insight.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-[10px] ${
                        insight.type === 'best-practice' 
                          ? 'bg-green-500/20 text-green-400' 
                          : insight.type === 'optimization'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {insight.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-200">
                System Learning Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-950 rounded-lg">
                  <div className="text-2xl font-bold text-slate-200">127</div>
                  <div className="text-xs text-slate-500">Patterns Learned</div>
                </div>
                <div className="text-center p-4 bg-slate-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">89%</div>
                  <div className="text-xs text-slate-500">Auto-Fix Success</div>
                </div>
                <div className="text-center p-4 bg-slate-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">34</div>
                  <div className="text-xs text-slate-500">Workflows Optimized</div>
                </div>
                <div className="text-center p-4 bg-slate-950 rounded-lg">
                  <div className="text-2xl font-bold text-amber-400">12h</div>
                  <div className="text-xs text-slate-500">Time Saved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixes" className="space-y-4">
          <div className="space-y-3">
            {recentFixes.map((fix, idx) => (
              <Card key={idx} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-200">{fix.workflow}</span>
                        {fix.autoApplied ? (
                          <Badge className="text-[10px] bg-green-500/20 text-green-400 border-0">
                            Auto-Applied
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-0">
                            Pending Review
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                          <div>
                            <div className="text-xs text-slate-500">Issue</div>
                            <div className="text-sm text-slate-300">{fix.issue}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                          <div>
                            <div className="text-xs text-slate-500">Fix Applied</div>
                            <div className="text-sm text-slate-300">{fix.fix}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-slate-500 ml-4">
                      <Clock className="w-3 h-3" />
                      {new Date(fix.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-200">
                Auto-Fix Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                <div>
                  <div className="text-sm text-slate-200">High Confidence Auto-Deploy</div>
                  <div className="text-xs text-slate-500">Automatically deploy fixes with &gt;95% confidence</div>
                </div>
                <Button variant="outline" size="sm" className="border-green-500/30 text-green-400">
                  Enabled
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                <div>
                  <div className="text-sm text-slate-200">Medium Confidence Review</div>
                  <div className="text-xs text-slate-500">Queue fixes with 80-95% confidence for review</div>
                </div>
                <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400">
                  Enabled
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                <div>
                  <div className="text-sm text-slate-200">Notification Alerts</div>
                  <div className="text-xs text-slate-500">Send Slack/email for all auto-fixes</div>
                </div>
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-400">
                  Disabled
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
