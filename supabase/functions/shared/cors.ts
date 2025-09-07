// Shared CORS Module for AgriConnect Edge Functions
// Provides consistent CORS handling across all endpoints

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Handle CORS preflight requests
 */
export const handleCors = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  return null;
};

/**
 * Add CORS headers to any response
 */
export const addCorsHeaders = (response: Response): Response => {
  const newHeaders = new Headers(response.headers);
  
  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
};

/**
 * Create a response with CORS headers
 */
export const createCorsResponse = (
  body: string | object,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response => {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders,
    ...additionalHeaders
  };

  const responseBody = typeof body === 'string' ? body : JSON.stringify(body);

  return new Response(responseBody, {
    status,
    headers
  });
};

/**
 * Create an error response with CORS headers
 */
export const createCorsErrorResponse = (
  message: string,
  status: number = 400,
  details?: any
): Response => {
  const body = {
    error: true,
    message,
    status,
    ...(details && { details })
  };

  return createCorsResponse(body, status);
};

/**
 * Create a success response with CORS headers
 */
export const createCorsSuccessResponse = (
  data: any,
  message?: string,
  status: number = 200
): Response => {
  const body = {
    success: true,
    data,
    ...(message && { message }),
    status
  };

  return createCorsResponse(body, status);
};

/**
 * CORS middleware for Edge Functions
 */
export const withCors = (handler: (req: Request) => Promise<Response>) => {
  return async (req: Request): Promise<Response> => {
    // Handle preflight requests
    const corsResponse = handleCors(req);
    if (corsResponse) {
      return corsResponse;
    }

    try {
      // Call the actual handler
      const response = await handler(req);
      
      // Add CORS headers to the response
      return addCorsHeaders(response);
    } catch (error) {
      // Handle errors with CORS headers
      return createCorsErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  };
};
