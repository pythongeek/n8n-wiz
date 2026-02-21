import { 
  Workflow, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Activity,
  DollarSign 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Workflows',
      value: stats.totalWorkflows,
      icon: Workflow,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      trend: '+12%',
    },
    {
      title: 'Deployed',
      value: stats.deployedWorkflows,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      trend: '+5%',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      trend: '+2.3%',
    },
    {
      title: 'Avg Execution',
      value: `${stats.averageExecutionTime}s`,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      trend: '-0.5s',
    },
    {
      title: 'Total Executions',
      value: stats.totalExecutions.toLocaleString(),
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      trend: '+234',
    },
    {
      title: 'AI Cost Today',
      value: `$${stats.aiCostToday.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      trend: '-8%',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-100">{card.value}</div>
              <span className={`text-xs font-medium ${
                card.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
              }`}>
                {card.trend}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
