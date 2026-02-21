const http = require('http');
const { chromium } = require('playwright-core');

const PORT = process.env.PORT || 3002;
const BROWSER_SECRET = process.env.BROWSER_SECRET;
const N8N_URL = process.env.N8N_URL || 'https://n8n.yourdomain.com';

let browser = null;
let context = null;

// Initialize browser
async function initBrowser() {
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    console.log('Browser initialized successfully');
  } catch (error) {
    console.error('Failed to initialize browser:', error);
    process.exit(1);
  }
}

// Authenticate request
function authenticate(req) {
  if (!BROWSER_SECRET) {
    console.warn('Warning: BROWSER_SECRET not set, authentication disabled');
    return true;
  }
  
  const secret = req.headers['x-secret'];
  return secret === BROWSER_SECRET;
}

// Execute browser actions
async function executeActions(actions) {
  if (!context) {
    throw new Error('Browser not initialized');
  }
  
  const page = await context.newPage();
  const results = {};
  
  try {
    for (const action of actions) {
      console.log(`Executing action: ${action.type}`);
      
      switch (action.type) {
        case 'navigate':
          await page.goto(action.value, { waitUntil: 'networkidle' });
          break;
          
        case 'click':
          await page.click(action.selector);
          break;
          
        case 'fill':
          await page.fill(action.selector, action.value);
          break;
          
        case 'wait':
          await page.waitForTimeout(action.timeout || 1000);
          break;
          
        case 'evaluate':
          const evalResult = await page.evaluate(action.value);
          if (action.storeAs) {
            results[action.storeAs] = evalResult;
          }
          break;
          
        case 'screenshot':
          const screenshot = await page.screenshot({ encoding: 'base64' });
          results.screenshot = screenshot;
          break;
          
        case 'waitForSelector':
          await page.waitForSelector(action.selector, { timeout: action.timeout || 10000 });
          break;
          
        case 'selectOption':
          await page.selectOption(action.selector, action.value);
          break;
          
        case 'press':
          await page.keyboard.press(action.value);
          break;
          
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    }
    
    // Extract workflow ID from URL if on workflow page
    const url = page.url();
    const workflowMatch = url.match(/workflow\/([a-zA-Z0-9-]+)/);
    if (workflowMatch) {
      results.workflowId = workflowMatch[1];
    }
    
    return { success: true, data: results };
  } catch (error) {
    console.error('Action execution failed:', error);
    
    // Take error screenshot
    try {
      const errorScreenshot = await page.screenshot({ encoding: 'base64' });
      results.errorScreenshot = errorScreenshot;
    } catch {
      // Ignore screenshot errors
    }
    
    return { success: false, error: error.message, data: results };
  } finally {
    await page.close();
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Secret');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      browser: browser ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    }));
    return;
  }
  
  // Authenticate
  if (!authenticate(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  
  // Execute actions endpoint
  if (req.url === '/execute' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { actions } = JSON.parse(body);
        
        if (!Array.isArray(actions)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Actions must be an array' }));
          return;
        }
        
        const result = await executeActions(actions);
        
        res.writeHead(result.success ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Browser automation server running on port ${PORT}`);
  console.log(`n8n URL: ${N8N_URL}`);
  console.log(`Authentication: ${BROWSER_SECRET ? 'enabled' : 'disabled'}`);
  
  await initBrowser();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  if (browser) {
    await browser.close();
  }
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  if (browser) {
    await browser.close();
  }
  server.close(() => {
    process.exit(0);
  });
});
