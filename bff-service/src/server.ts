import http from 'http';
import { URL } from 'url';
import dotenv from 'dotenv';
import { handleRequest } from './utils/requestHandler';
import { parseBody } from './utils/bodyParser';

dotenv.config();

const PORT = process.env.PORT || 5000;

interface RequestError extends Error {
  status?: number;
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
    return;
  }

  try {
    if (!req.url) {
      throw new Error('No URL provided');
    }

    // Parse URL and query parameters
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    
    // Extract service name from path
    const serviceName = pathSegments[0];

    if (!serviceName) {
      throw new Error('Service name is required');
    }

    // Validate service
    const allowedServices = process.env.ALLOWED_SERVICES?.split(',') || [];
    if (!allowedServices.includes(serviceName.toLowerCase())) {
      throw new Error('Invalid service');
    }

    // Get service URL from environment variables
    const serviceUrl = process.env[`${serviceName.toUpperCase()}_SERVICE_URL`];
    if (!serviceUrl) {
      throw new Error('Service URL not configured');
    }

    // Parse request body if present
    const body = await parseBody(req);

    // Handle the request
    await handleRequest({
      req,
      res,
      serviceUrl,
      serviceName,
      pathSegments,
      queryParams: parsedUrl.searchParams,
      body
    });

  } catch (error) {
    const err = error as RequestError;
    console.error('Error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Cannot process request' }));
  }
});

server.listen(PORT, () => {
  console.log(`BFF Service running on port ${PORT}`);
});
