import { IncomingMessage, ServerResponse, OutgoingHttpHeaders } from 'http';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { cacheService } from './cacheService';

interface RequestHandlerParams {
  req: IncomingMessage;
  res: ServerResponse;
  serviceUrl: string;
  serviceName: string;
  pathSegments: string[];
  queryParams: URLSearchParams;
  body: any;
}

export const handleRequest = async ({
  req,
  res,
  serviceUrl,
  serviceName,
  pathSegments,
  queryParams,
  body
}: RequestHandlerParams): Promise<void> => {
  try {
    // Remove the service name from the path
    const servicePath = pathSegments.slice(1).join('/');
    
    // Build target URL - ensure proper URL construction
    let targetUrl = new URL(
      servicePath,
      serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`
    ).toString();

    // Add query parameters if they exist
    if (queryParams.toString()) {
      const path = queryParams.get('path')?.slice(1);
      if (path) targetUrl += path;
    }
    console.log('Request method:', req.method);
    console.log('servicename', serviceName);
    console.log(`Forwarding request to: ${targetUrl}`);
    console.log('Check headers:', req.headers)
    console.log('Check auth header:', req.headers.authorization ?? 'No auth header')

      // Check if it's a products list request
    const isProductsList = serviceName === 'product' &&  req.method === 'GET';

    console.log('isProductlist', isProductsList);
    
    // If it's a products list request, try to get from cache
    if (isProductsList) {
      const cachedData = cacheService.get<any>('productsList');
      if (cachedData) {
        console.log('Serving from cache');
        res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT'
        });
        res.end(JSON.stringify(cachedData));
        return;
      }
    }

    const axiosConfig: AxiosRequestConfig = {
      method: req.method || 'GET',
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && {
          'Authorization': req.headers.authorization
        })
      },
      validateStatus: () => true,
      maxRedirects: 5,
      timeout: 10000
    };

    // Only add body for POST, PUT, PATCH methods
    if (body && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      axiosConfig.data = body;
    }
    console.log('Axios config:', axiosConfig);
    const response = await axios(axiosConfig);

    // If it's a successful products list request, cache the response
    if (isProductsList && response.status === 200) {
      console.log('Caching products list');
      cacheService.set('productsList', response.data);
    }

    // If it's a successful product creation, invalidate the cache
    if (serviceName === 'product' && req.method === 'POST' && response.status === 200) {
      console.log('Invalidating products list cache');
      cacheService.del('productsList');
    }

    // Convert Axios headers to OutgoingHttpHeaders
    const responseHeaders: OutgoingHttpHeaders = {
      'Content-Type': 'application/json',
      'X-Cache': isProductsList ? 'MISS' : 'BYPASS'
    };

    // Safely copy headers
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            responseHeaders[key.toLowerCase()] = value;
          } else {
            responseHeaders[key.toLowerCase()] = String(value);
          }
        }
      });
    }

    // Forward response
    res.writeHead(response.status, responseHeaders);
    
    // Ensure we're sending JSON
    const responseData = typeof response.data === 'string' 
      ? response.data 
      : JSON.stringify(response.data);
    
    res.end(responseData);

  } catch (error) {
    console.error('Request failed:', error);
    
    const axiosError = error as AxiosError;
    const statusCode = axiosError.response?.status || 502;
    
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Cannot process request',
      details: axiosError.message
    }));
  }
};
