// Shared Logging Module for AgriConnect Edge Functions
// Provides structured logging for requests, responses, and errors

export interface LogContext {
  functionName: string;
  userId?: string;
  requestId?: string;
  cooperativeId?: string;
  [key: string]: any;
}

export interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  userId?: string;
  cooperativeId?: string;
  userAgent?: string;
  ip?: string;
  type: 'request';
}

export interface ResponseLog {
  timestamp: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  cooperativeId?: string;
  type: 'response';
}

export interface ErrorLog {
  timestamp: string;
  error: string;
  stack?: string;
  context: LogContext;
  type: 'error';
}

export interface PerformanceLog {
  timestamp: string;
  operation: string;
  duration: number;
  userId?: string;
  cooperativeId?: string;
  type: 'performance';
}

/**
 * Generate a unique request ID
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Extract client information from request
 */
export const extractClientInfo = (req: Request) => {
  const url = new URL(req.url);
  const userAgent = req.headers.get('User-Agent') || 'unknown';
  const ip = req.headers.get('X-Forwarded-For') || 
             req.headers.get('X-Real-IP') || 
             'unknown';

  return {
    path: url.pathname,
    method: req.method,
    userAgent,
    ip,
    query: url.searchParams.toString()
  };
};

/**
 * Log incoming request
 */
export const logRequest = (
  req: Request,
  context: LogContext
): string => {
  const requestId = generateRequestId();
  const clientInfo = extractClientInfo(req);
  
  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method: clientInfo.method,
    path: clientInfo.path,
    userId: context.userId,
    cooperativeId: context.cooperativeId,
    userAgent: clientInfo.userAgent,
    ip: clientInfo.ip,
    type: 'request'
  };

  console.log(JSON.stringify({
    requestId,
    ...log,
    context: {
      functionName: context.functionName,
      query: clientInfo.query
    }
  }));

  return requestId;
};

/**
 * Log response
 */
export const logResponse = (
  statusCode: number,
  responseTime: number,
  context: LogContext,
  requestId?: string
): void => {
  const log: ResponseLog = {
    timestamp: new Date().toISOString(),
    statusCode,
    responseTime,
    userId: context.userId,
    cooperativeId: context.cooperativeId,
    type: 'response'
  };

  console.log(JSON.stringify({
    requestId,
    ...log,
    context: {
      functionName: context.functionName
    }
  }));
};

/**
 * Log error with context
 */
export const logError = (
  error: Error,
  context: LogContext,
  requestId?: string
): void => {
  const log: ErrorLog = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context,
    type: 'error'
  };

  console.error(JSON.stringify({
    requestId,
    ...log
  }));
};

/**
 * Log performance metrics
 */
export const logPerformance = (
  operation: string,
  duration: number,
  context: LogContext,
  requestId?: string
): void => {
  const log: PerformanceLog = {
    timestamp: new Date().toISOString(),
    operation,
    duration,
    userId: context.userId,
    cooperativeId: context.cooperativeId,
    type: 'performance'
  };

  console.log(JSON.stringify({
    requestId,
    ...log,
    context: {
      functionName: context.functionName
    }
  }));
};

/**
 * Performance measurement decorator
 */
export const measurePerformance = (
  operation: string,
  context: LogContext,
  requestId?: string
) => {
  const startTime = Date.now();
  
  return () => {
    const duration = Date.now() - startTime;
    logPerformance(operation, duration, context, requestId);
    return duration;
  };
};

/**
 * Create logging context from request and user
 */
export const createLogContext = (
  functionName: string,
  user?: { id: string; cooperative_id?: string }
): LogContext => {
  return {
    functionName,
    userId: user?.id,
    cooperativeId: user?.cooperative_id
  };
};

/**
 * Logging middleware for Edge Functions
 */
export const withLogging = (
  functionName: string,
  handler: (req: Request, context: LogContext) => Promise<Response>
) => {
  return async (req: Request): Promise<Response> => {
    const startTime = Date.now();
    let requestId: string | undefined;
    let context: LogContext;

    try {
      // Extract user info if available (after auth)
      let user: any = null;
      try {
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          // This is a simplified version - in practice, you'd validate the token
          // For now, we'll just log the request without user context
        }
      } catch (authError) {
        // Continue without user context if auth fails
      }

      context = createLogContext(functionName, user);
      requestId = logRequest(req, context);

      // Call the actual handler
      const response = await handler(req, context);
      
      // Log response
      const responseTime = Date.now() - startTime;
      logResponse(response.status, responseTime, context, requestId);

      return response;
    } catch (error) {
      // Log error
      const responseTime = Date.now() - startTime;
      context = context || createLogContext(functionName);
      logError(error instanceof Error ? error : new Error(String(error)), context, requestId);
      logResponse(500, responseTime, context, requestId);

      // Return error response
      return new Response(JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Internal server error',
        requestId
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        }
      });
    }
  };
};

/**
 * Utility to log database operations
 */
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  context: LogContext,
  requestId?: string
): void => {
  logPerformance(`db_${operation}_${table}`, duration, context, requestId);
};

/**
 * Utility to log external API calls
 */
export const logExternalApiCall = (
  service: string,
  endpoint: string,
  duration: number,
  statusCode: number,
  context: LogContext,
  requestId?: string
): void => {
  logPerformance(`api_${service}_${endpoint}`, duration, {
    ...context,
    externalService: service,
    externalEndpoint: endpoint,
    externalStatusCode: statusCode
  }, requestId);
};
