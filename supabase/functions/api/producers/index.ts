// Producers API - GET /api/producers and POST /api/producers

import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  validationErrorResponse,
  corsHeaders,
  handleCors,
  authenticateUser,
  parseQueryParams,
  buildPaginationQuery,
  buildSearchQuery,
  buildFilterQuery,
  logRequest,
  logError
} from '../../shared/utils.ts';
import { validateProducer, getValidationErrors } from '../../shared/validation.ts';
import { supabase } from '../../shared/utils.ts';
import type { Producer, CreateProducerRequest, QueryParams } from '../../shared/types.ts';

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const method = req.method;

    logRequest(method, url.pathname);

    // Authenticate user
    const user = await authenticateUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    if (method === 'GET') {
      // GET /api/producers - List producers
      return await handleGetProducers(url, user);
    } else if (method === 'POST') {
      // POST /api/producers - Create producer
      return await handleCreateProducer(req, user);
    } else {
      return errorResponse('Method not allowed', 405);
    }
  } catch (error) {
    logError(error, 'producers/index');
    return errorResponse('Internal server error', 500);
  }
});

async function handleGetProducers(url: URL, user: any) {
  try {
    const params = parseQueryParams(url);
    
    // Build base query
    let query = supabase
      .from('producers')
      .select('*');

    // Apply cooperative filter based on user role
    if (user.role === 'agent' || user.role === 'coop_admin') {
      query = query.eq('cooperative_id', user.cooperative_id);
    }

    // Apply search filter
    if (params.search) {
      query = buildSearchQuery(query, params.search, ['first_name', 'last_name', 'phone', 'village']);
    }

    // Apply other filters
    const filters = {
      cooperative_id: 'cooperative_id',
      region: 'region',
      department: 'department'
    };
    query = buildFilterQuery(query, params, filters);

    // Get total count for pagination
    const { count } = await supabase
      .from('producers')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    query = buildPaginationQuery(query, params);

    // Execute query
    const { data: producers, error } = await query;

    if (error) {
      logError(error, 'producers/get');
      return errorResponse('Failed to fetch producers', 500);
    }

    // Calculate pagination info
    const total = count || 0;
    const totalPages = Math.ceil(total / params.limit);

    const response = {
      success: true,
      data: producers,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });

  } catch (error) {
    logError(error, 'producers/get');
    return errorResponse('Failed to fetch producers', 500);
  }
}

async function handleCreateProducer(req: Request, user: any) {
  try {
    // Check if user can create producers
    if (!['admin', 'supervisor', 'agent'].includes(user.role)) {
      return errorResponse('Insufficient permissions to create producers', 403);
    }

    // Parse request body
    const body = await req.json();
    
    // Validate request data
    const validation = validateProducer(body);
    if (!validation.success) {
      const errors = getValidationErrors(validation);
      return validationErrorResponse(errors);
    }

    const producerData: CreateProducerRequest = validation.data;

    // Set cooperative_id based on user role
    if (user.role === 'agent' || user.role === 'coop_admin') {
      producerData.cooperative_id = user.cooperative_id;
    }

    // Check if phone number already exists
    const { data: existingProducer } = await supabase
      .from('producers')
      .select('id')
      .eq('phone', producerData.phone)
      .single();

    if (existingProducer) {
      return errorResponse('Producer with this phone number already exists', 409);
    }

    // Create producer
    const { data: producer, error } = await supabase
      .from('producers')
      .insert([producerData])
      .select()
      .single();

    if (error) {
      logError(error, 'producers/create');
      return errorResponse('Failed to create producer', 500);
    }

    const response = successResponse(producer, 'Producer created successfully');

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });

  } catch (error) {
    logError(error, 'producers/create');
    return errorResponse('Failed to create producer', 500);
  }
}
