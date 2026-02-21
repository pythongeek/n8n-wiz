# n8n Agent Dashboard - Project Summary

## What Was Built

A complete, production-ready **n8n Agent Dashboard** that combines AI-powered workflow generation with dual deployment options for Bangladesh infrastructure.

### Core Features

1. **AI Workflow Generator**
   - Natural language to n8n workflow conversion
   - Dual AI model support (Kimi 2.5 + Gemini 2.5)
   - Automatic model selection based on complexity
   - Visual workflow editor with ReactFlow

2. **Dual Deployment Modes**
   - **MCP Bridge** (recommended): Direct API integration
   - **Browser Automation** (fallback): Playwright-based automation

3. **Self-Feeding Knowledge System**
   - Learns from execution patterns
   - Auto-fixes workflows with >95% confidence
   - Stores patterns for future use

4. **Real-Time Monitoring**
   - Live execution feed
   - Performance metrics & charts
   - System logs

5. **Workflow Library**
   - Browse, filter, and manage workflows
   - Version control and iteration tracking
   - Status monitoring (draft → testing → deployed)

## Project Structure

```
n8n-agent-dashboard/
├── src/
│   ├── components/
│   │   ├── dashboard/          # Header, StatsCards
│   │   ├── workflow/           # WorkflowBuilder, Library, KnowledgeBase, Monitor
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── workflow-generator.ts    # AI workflow generation
│   │   ├── deployers/
│   │   │   ├── mcp-deployer.ts      # MCP Bridge deployment
│   │   │   └── browser-deployer.ts  # Browser automation
│   │   └── knowledge/
│   │       └── self-feeder.ts       # Auto-fix system
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   ├── App.tsx                 # Main application
│   └── index.css               # Global styles
├── docker/
│   ├── docker-compose.yml      # Full infrastructure stack
│   ├── .env.example            # Docker environment template
│   ├── mcp-bridge/             # MCP server implementation
│   ├── browser-scripts/        # Playwright automation
│   └── cloudflared/            # Tunnel configuration
├── docs/
│   ├── openapi.yaml            # API specification
│   └── RUNBOOK.md              # Operations guide
├── .env.example                # Dashboard environment template
├── README.md                   # Full documentation
└── package.json
```

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/n8n-agent-dashboard.git
cd n8n-agent-dashboard
npm install
```

### 2. Configure Environment

```bash
# Dashboard environment
cp .env.example .env.local
# Edit .env.local with your values

# Docker environment
cp docker/.env.example docker/.env
# Edit docker/.env with your values
```

### 3. Start Local Infrastructure

```bash
cd docker
docker-compose up -d
```

### 4. Deploy to Vercel

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Environment Variables Required

### Dashboard (.env.local)

| Variable | Description |
|----------|-------------|
| `VITE_KIMI_API_KEY` | Moonshot API key |
| `VITE_GEMINI_API_KEY` | Google AI Studio key |
| `VITE_MCP_SERVER_URL` | MCP Bridge URL |
| `VITE_MCP_API_KEY` | MCP authentication |
| `VITE_N8N_PUBLIC_URL` | n8n public URL |

### Docker (docker/.env)

| Variable | Description |
|----------|-------------|
| `N8N_ENCRYPTION_KEY` | n8n credential encryption |
| `POSTGRES_PASSWORD` | Database password |
| `TUNNEL_URL` | Cloudflare tunnel URL |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare tunnel token |
| `N8N_API_KEY` | n8n API key |

## Key Technologies

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **AI**: Vercel AI SDK (Kimi 2.5, Gemini 2.5)
- **Workflow Visualization**: ReactFlow
- **Charts**: Recharts
- **Backend**: n8n + PostgreSQL + Redis
- **Deployment**: Docker + Cloudflare Tunnel
- **Monitoring**: Real-time execution tracking

## Architecture

```
Vercel Dashboard ←→ Cloudflare Tunnel ←→ Local Docker
                        ↓
            ┌───────────┴───────────┐
            ↓                       ↓
        MCP Bridge            Browser Auto
            ↓                       ↓
            └───────────┬───────────┘
                        ↓
                    n8n Docker
                        ↓
                PostgreSQL + Redis
```

## Next Steps

1. **Get API Keys**:
   - Moonshot (Kimi): https://platform.moonshot.cn/
   - Google AI (Gemini): https://aistudio.google.com/

2. **Set Up Cloudflare Tunnel**:
   - Create tunnel in Cloudflare Dashboard
   - Configure DNS records for n8n, mcp, browser

3. **Deploy**:
   - Push to GitHub
   - Connect to Vercel
   - Configure environment variables

4. **Test**:
   - Generate a test workflow
   - Deploy via MCP Bridge
   - Monitor execution

## Support

- Documentation: See README.md and docs/RUNBOOK.md
- API Spec: See docs/openapi.yaml
- Issues: Create GitHub issue

---

Built for the n8n community in Bangladesh and beyond.
