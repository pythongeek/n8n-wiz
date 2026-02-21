import { Workflow, Settings, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  activeDeployment: 'mcp' | 'browser';
  onDeploymentChange: (mode: 'mcp' | 'browser') => void;
}

export function Header({ activeDeployment, onDeploymentChange }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">n8n Agent Architect</h1>
            <p className="text-xs text-slate-400">Self-feeding workflow automation</p>
          </div>
        </div>

        {/* Deployment Mode Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => onDeploymentChange('mcp')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeDeployment === 'mcp'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                MCP Bridge
              </span>
            </button>
            <button
              onClick={() => onDeploymentChange('browser')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeDeployment === 'browser'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Browser Auto
              </span>
            </button>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-700">
              <DropdownMenuLabel className="text-slate-200">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer hover:bg-slate-800">
                  <span className="text-sm text-slate-200">Workflow deployment successful</span>
                  <span className="text-xs text-slate-500">Customer Support Bot v2.1</span>
                  <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">
                    2 min ago
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer hover:bg-slate-800">
                  <span className="text-sm text-slate-200">Auto-fix applied</span>
                  <span className="text-xs text-slate-500">Added retry logic to Marketing Pipeline</span>
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                    15 min ago
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer hover:bg-slate-800">
                  <span className="text-sm text-slate-200">Execution error detected</span>
                  <span className="text-xs text-slate-500">Data Processing Workflow - Rate limit</span>
                  <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400">
                    1 hour ago
                  </Badge>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
              <DropdownMenuLabel className="text-slate-200">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                API Keys
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
