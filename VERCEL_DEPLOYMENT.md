# Vercel Free Tier + Supabase Deployment Guide

This guide will help you deploy the n8n Agent Dashboard to **Vercel's Free Tier** with **Supabase PostgreSQL** as the database backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel (Free Tier)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  React App  │  │  API Routes │  │  Serverless Functions   │  │
│  │  (Static)   │  │  (/api/*)   │  │  (Workflow Generation)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (Free Tier)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ PostgreSQL  │  │  Realtime   │  │  Row Level Security     │  │
│  │  Database   │  │  WebSockets │  │  (RLS)                  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (Free tier included)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com) (Free tier includes 500MB database)
3. **API Keys**:
   - Moonshot (Kimi) API key: [platform.moonshot.cn](https://platform.moonshot.cn)
   - Google AI (Gemini) API key: [aistudio.google.com](https://aistudio.google.com)

## Step 1: Set Up Supabase

### 1.1 Create a New Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `n8n-agent-dashboard`
5. Set a secure database password (save this!)
6. Choose region closest to your users (e.g., `us-east-1`)
7. Click "Create new project"

### 1.2 Run the Database Schema

1. Once your project is ready, go to the **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql` from this repo
4. Paste into the SQL Editor
5. Click "Run"

This will create all the necessary tables:
- `workflows` - Store your generated workflows
- `executions` - Track workflow execution history
- `knowledge_base` - Store learned patterns and auto-fixes
- `workflow_versions` - Version control for workflows
- `deployment_logs` - Track deployment attempts

### 1.3 Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - `URL` (e.g., `https://abcdefgh12345678.supabase.co`)
   - `anon public` key (starts with `eyJhbG...`)

Save these for the next step.

## Step 2: Deploy to Vercel

### 2.1 Connect Your Repository

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Vercel will auto-detect the Vite framework

### 2.2 Configure Environment Variables

In the Vercel project settings, add these environment variables:

| Variable | Value | Source |
|----------|-------|--------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Supabase Dashboard → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase Dashboard → API |
| `VITE_KIMI_API_KEY` | Your Moonshot API key | [platform.moonshot.cn](https://platform.moonshot.cn) |
| `VITE_GEMINI_API_KEY` | Your Google AI key | [aistudio.google.com](https://aistudio.google.com) |
| `VITE_DEPLOYMENT_MODE` | `vercel` | Set this value |

Optional (for local n8n integration):
| `VITE_MCP_SERVER_URL` | Your MCP bridge URL | If using local n8n |
| `VITE_N8N_PUBLIC_URL` | Your n8n public URL | If using local n8n |

### 2.3 Deploy

Click "Deploy" and wait for the build to complete!

## Step 3: Configure Serverless Functions (Optional)

If you want to use serverless API routes for workflow generation (keeps API keys secure):

### 3.1 Add Server Environment Variables

In Vercel project settings, add:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Same as VITE_SUPABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → API → service_role key |
| `KIMI_API_KEY` | Your Moonshot API key |
| `GEMINI_API_KEY` | Your Google AI key |

### 3.2 Install Vercel Dependencies

```bash
npm install --save-dev @vercel/node
```

## Free Tier Limits

### Vercel Free Tier
- **Bandwidth**: 100GB/month
- **Build Time**: 6,000 minutes/month
- **Serverless Function Execution**: 10,000 requests/day (Hobby plan)
- **Serverless Function Duration**: 10 seconds per invocation

### Supabase Free Tier
- **Database**: 500MB
- **Bandwidth**: 2GB/month
- **API Requests**: 100,000/month
- **Realtime Connections**: 200 concurrent

## Cost Optimization Tips

1. **Use Client-Side AI Generation**: The default setup calls AI APIs directly from the browser, avoiding serverless function costs
2. **Enable Caching**: Vercel automatically caches static assets
3. **Optimize Images**: Use Vercel's image optimization
4. **Monitor Usage**: Check Vercel and Supabase dashboards regularly

## Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Fill in your values in .env.local
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_KIMI_API_KEY=your-kimi-key
# VITE_GEMINI_API_KEY=your-gemini-key

# Run dev server
npm run dev
```

## Connecting to Local n8n (Optional)

If you want to deploy workflows to a local n8n instance:

1. Set up local n8n with Docker (see README.md)
2. Configure Cloudflare Tunnel to expose n8n
3. Add `VITE_MCP_SERVER_URL` and `VITE_N8N_PUBLIC_URL` to Vercel env vars
4. Set `VITE_DEPLOYMENT_MODE=hybrid`

## Troubleshooting

### Build Failures
- Check that all environment variables are set
- Ensure `vercel.json` is in the root directory
- Verify TypeScript compiles: `npm run build`

### Database Connection Issues
- Verify Supabase URL and anon key are correct
- Check that Row Level Security (RLS) policies allow your operations
- Check browser console for CORS errors

### API Rate Limits
- Vercel: 10,000 requests/day on free tier
- Supabase: 100,000 requests/month on free tier
- Consider implementing client-side caching

## Next Steps

1. **Set up authentication**: Add Supabase Auth for user management
2. **Add webhooks**: Configure n8n webhooks to report execution status
3. **Enable realtime**: Use Supabase Realtime for live execution updates
4. **Add monitoring**: Integrate Vercel Analytics or Logflare

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Project Issues**: Create a GitHub issue in this repository
