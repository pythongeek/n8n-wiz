# n8n Agent Dashboard

A production-grade, self-feeding workflow automation platform that combines the power of AI (Kimi 2.5 + Gemini 2.5) with n8n's automation capabilities. Deployed on Vercel with local Docker-hosted n8n infrastructure.

![Dashboard Preview](https://via.placeholder.com/800x400/0f172a/3b82f6?text=n8n+Agent+Dashboard)

## Features

- **AI-Powered Workflow Generation**: Describe your automation needs in natural language, and the AI generates complete n8n workflows
- **Dual AI Model Support**: Automatically selects Kimi 2.5 for complex reasoning or Gemini 2.5 for speed/cost optimization
- **Dual Deployment Modes**: 
  - **MCP Bridge**: Direct API integration (recommended)
  - **Browser Automation**: Playwright-based fallback for compatibility
- **Self-Feeding Knowledge Base**: Learns from successes and failures, auto-fixes workflows
- **Real-Time Monitoring**: Live execution tracking with metrics and logs
- **Bangladesh-Optimized**: Cloudflare Tunnel handles local ISP NAT issues

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERCEL NEXT.JS DASHBOARD                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   AI Agent   │  │  Workflow    │  │  Knowledge   │  │   Testing    │   │
│  │   Builder    │  │   Library    │  │    Base      │  │   & Deploy   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
            ┌───────▼────────┐                ┌────────▼────────┐
            │  MCP BRIDGE    │                │ DOCKER BROWSER  │
            │  (Option 1)    │                │ AUTOMATION      │
            │                │                │ (Option 2)      │
            └───────┬────────┘                └────────┬────────┘
                    │                                   │
                    └───────────────┬───────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  LOCAL N8N DOCKER  │
                          │  (Your Bangladesh  │
                          │   Infrastructure)  │
                          └────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Cloudflare account (for tunnel)
- API keys for Kimi (Moonshot) and/or Gemini

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

This starts:
- n8n (http://localhost:5678)
- PostgreSQL database
- MCP Bridge (http://localhost:3001)
- Browser Automation (http://localhost:3002)
- Cloudflare Tunnel

### 4. Configure Cloudflare Tunnel

1. Create a tunnel in Cloudflare Dashboard
2. Copy the tunnel token to `docker/.env`
3. Configure DNS records:
   - `n8n.yourdomain.com` → n8n UI
   - `mcp.yourdomain.com` → MCP Bridge
   - `browser.yourdomain.com` → Browser Automation

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Environment Variables

### Dashboard (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_KIMI_API_KEY` | Moonshot API key | Optional |
| `VITE_GEMINI_API_KEY` | Google AI Studio key | Optional |
| `VITE_MCP_SERVER_URL` | MCP Bridge URL | Yes |
| `VITE_MCP_API_KEY` | MCP authentication | Yes |
| `VITE_BROWSER_AUTOMATION_URL` | Browser service URL | Optional |
| `VITE_BROWSER_SECRET` | Browser auth secret | Optional |
| `VITE_N8N_PUBLIC_URL` | n8n public URL | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | Optional |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | Optional |

### Docker (docker/.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `N8N_ENCRYPTION_KEY` | n8n credential encryption | Yes |
| `N8N_BASIC_AUTH_PASSWORD` | n8n UI password | Yes |
| `POSTGRES_PASSWORD` | Database password | Yes |
| `TUNNEL_URL` | Your Cloudflare tunnel URL | Yes |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare tunnel token | Yes |
| `N8N_API_KEY` | n8n API key | Yes |
| `MCP_API_KEY` | MCP bridge auth | Yes |
| `MOONSHOT_API_KEY` | For n8n workflows | Optional |
| `GEMINI_API_KEY` | For n8n workflows | Optional |

## Usage

### Generating Workflows

1. Go to the **AI Builder** tab
2. Describe your automation needs (e.g., "Monitor RSS feeds for AI news and post summaries to Slack")
3. Select category and AI model preference
4. Click "Generate Workflow"
5. Review the visual editor and JSON output

### Deploying Workflows

1. After generation, click "Deploy"
2. Choose deployment mode (MCP Bridge recommended)
3. Monitor deployment status
4. Test the deployed workflow

### Monitoring Executions

1. Go to the **Live Monitor** tab
2. View real-time execution feed
3. Check metrics and performance charts
4. Review system logs

### Knowledge Base

The system automatically learns from:
- Successful workflow patterns
- Error patterns and fixes
- Optimization opportunities

View insights and auto-fixes in the **Knowledge Base** tab.

## API Documentation

See [docs/openapi.yaml](docs/openapi.yaml) for complete API specification.

### Key Endpoints

```
POST /api/workflows/generate    # Generate workflow from prompt
POST /api/deploy/mcp            # Deploy via MCP Bridge
POST /api/deploy/browser        # Deploy via Browser Automation
GET  /api/monitor/stats         # Get dashboard statistics
GET  /api/health                # Health check
```

## Deployment Modes

### MCP Bridge (Recommended)

Direct API integration with n8n. Fast, reliable, and supports all n8n features.

```yaml
# docker-compose.yml includes mcp-bridge service
# Configure VITE_MCP_SERVER_URL in dashboard
```

### Browser Automation (Fallback)

Playwright-based browser automation for compatibility when MCP is unavailable.

```yaml
# Enable with: docker-compose --profile browser up -d
# Configure VITE_BROWSER_AUTOMATION_URL in dashboard
```

## Self-Feeding System

The platform learns and improves automatically:

1. **Pattern Recognition**: Identifies successful workflow structures
2. **Error Analysis**: Analyzes failures and suggests fixes
3. **Auto-Fix**: Applies fixes with >95% confidence automatically
4. **Knowledge Persistence**: Stores patterns in Supabase for future use

## Troubleshooting

### n8n Connection Issues

```bash
# Check n8n health
curl http://localhost:5678/healthz

# Check logs
docker-compose logs -f n8n
```

### MCP Bridge Issues

```bash
# Check MCP health
curl http://localhost:3001/health

# Restart MCP service
docker-compose restart mcp-bridge
```

### Cloudflare Tunnel Issues

```bash
# Check tunnel status
docker-compose logs -f cloudflared

# Verify tunnel token is correct
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Production Checklist

- [ ] Change all default passwords
- [ ] Generate strong encryption keys
- [ ] Configure Cloudflare Tunnel
- [ ] Set up Supabase for knowledge persistence
- [ ] Enable backup service
- [ ] Configure monitoring alerts
- [ ] Review CORS settings
- [ ] Test disaster recovery

## Security

- All credentials stored in n8n's encrypted credential store
- API keys never exposed to client-side code
- Webhook authentication with HMAC-SHA256
- Cloudflare Tunnel provides secure access without open ports
- CORS configured for Vercel domains only

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: [docs/](docs/)
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

Built with ❤️ for the n8n community in Bangladesh and beyond.
