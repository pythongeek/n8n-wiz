const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const N8N_API_URL = process.env.N8N_API_URL || 'http://n8n:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;
const MCP_API_KEY = process.env.MCP_API_KEY;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Key authentication
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!MCP_API_KEY) {
    console.warn('Warning: MCP_API_KEY not set, authentication disabled');
    return next();
  }
  
  if (apiKey !== MCP_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// n8n API client
const n8nClient = axios.create({
  baseURL: `${N8N_API_URL}/api/v1`,
  headers: {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
  },
});

// MCP Tool: create_workflow
app.post('/mcp/call', authenticateApiKey, async (req, res) => {
  const { tool, params } = req.body;
  
  try {
    let result;
    
    switch (tool) {
      case 'create_workflow':
        result = await n8nClient.post('/workflows', {
          name: params.name,
          ...params.workflow,
        });
        break;
        
      case 'create_workflow_and_activate':
        const createRes = await n8nClient.post('/workflows', {
          name: params.workflow.name,
          ...params.workflow,
        });
        const workflowId = createRes.data.id;
        await n8nClient.post(`/workflows/${workflowId}/activate`);
        result = { data: { id: workflowId, ...createRes.data } };
        break;
        
      case 'update_workflow':
        result = await n8nClient.patch(`/workflows/${params.id}`, params.workflow);
        break;
        
      case 'delete_workflow':
        result = await n8nClient.delete(`/workflows/${params.id}`);
        break;
        
      case 'activate_workflow':
        result = await n8nClient.post(`/workflows/${params.id}/activate`);
        break;
        
      case 'deactivate_workflow':
        result = await n8nClient.post(`/workflows/${params.id}/deactivate`);
        break;
        
      case 'execute_workflow':
        result = await n8nClient.post(`/workflows/${params.id}/execute`, params.data);
        break;
        
      case 'get_workflow_status':
        const statusRes = await n8nClient.get(`/workflows/${params.id}`);
        result = { 
          data: { 
            active: statusRes.data.active,
            lastExecuted: statusRes.data.lastExecuted,
            executionCount: statusRes.data.executionCount,
          } 
        };
        break;
        
      case 'list_workflows':
        const listRes = await n8nClient.get('/workflows');
        result = { data: { workflows: listRes.data.data } };
        break;
        
      case 'get_execution':
        result = await n8nClient.get(`/executions/${params.id}`);
        break;
        
      case 'list_executions':
        const execRes = await n8nClient.get('/executions', {
          params: { workflowId: params.workflowId, limit: params.limit || 20 },
        });
        result = { data: { executions: execRes.data.data } };
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Unknown tool: ${tool}` 
        });
    }
    
    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error(`Error calling tool ${tool}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// List available tools
app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: [
      { name: 'create_workflow', description: 'Create a new workflow' },
      { name: 'create_workflow_and_activate', description: 'Create and activate a workflow' },
      { name: 'update_workflow', description: 'Update an existing workflow' },
      { name: 'delete_workflow', description: 'Delete a workflow' },
      { name: 'activate_workflow', description: 'Activate a workflow' },
      { name: 'deactivate_workflow', description: 'Deactivate a workflow' },
      { name: 'execute_workflow', description: 'Execute a workflow' },
      { name: 'get_workflow_status', description: 'Get workflow status' },
      { name: 'list_workflows', description: 'List all workflows' },
      { name: 'get_execution', description: 'Get execution details' },
      { name: 'list_executions', description: 'List executions for a workflow' },
    ],
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Bridge server running on port ${PORT}`);
  console.log(`n8n API URL: ${N8N_API_URL}`);
  console.log(`Authentication: ${MCP_API_KEY ? 'enabled' : 'disabled'}`);
});
