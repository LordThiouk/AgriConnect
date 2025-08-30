// Producer API - GET /api/producers/:id, PUT /api/producers/:id, DELETE /api/producers/:id

import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  corsHeaders,
  handleCors,
  authenticateUser,
  canAccessProducer,
  canModifyData,
  canDeleteData,
  logRequest,
  logError
} from '../../shared/utils.ts';
import { validateProducerUpdate, getValidationErrors } from '../../shared/validation.ts';
import { supabase } from '../../shared/utils.ts';
import type { Producer, UpdateProducerRequest } from '../../shared/types.ts';

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const method = req.method;
    const producerId = url.pathname.split('/').pop();

    if (!producerId) {
      return errorResponse('Producer ID is required', 400);
    }

    logRequest(method, url.pathname);

    // Authenticate user
    const user = await authenticateUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    if (method === 'GET') {
      // GET /api/producers/:id - Get producer details
      return await handleGetProducer(producerId, user);
    } else if (method === 'PUT') {
      // PUT /api/producers/:id - Update producer
      return await handleUpdateProducer(producerId, req, user);
    } else if (method === 'DELETE') {
      // DELETE /api/producers/:id - Delete producer
      return await handleDeleteProducer(producerId, user);
    } else {
      return errorResponse('Method not allowed', 405);
    }
  } catch (error) {
    logError(error, 'producers/[id]');
    return errorResponse('Internal server error', 500);
  }
});

async function handleGetProducer(producerId: string, user: any) {
  try {
    // Get producer with cooperative info
    const { data: producer, error } = await supabase
      .from('producers')
      .select(`
        *,
        cooperatives (
          id,
          name,
          region,
          department
        )
      `)
      .eq('id', producerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Producer');
      }
      logError(error, 'producers/get-by-id');
      return errorResponse('Failed to fetch producer', 500);
    }

    // Check access permissions
    if (!canAccessProducer(user, producer.cooperative_id)) {
      return forbiddenResponse();
    }

    const response = successResponse(producer);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });

  } catch (error) {
    logError(error, 'producers/get-by-id');
    return errorResponse('Failed to fetch producer', 500);
  }
}

async function handleUpdateProducer(producerId: string, req: Request, user: any) {
  try {
    // Check if user can modify data
    if (!canModifyData(user)) {
      return forbiddenResponse();
    }

    // Get existing producer to check permissions
    const { data: existingProducer, error: fetchError } = await supabase
      .from('producers')
      .select('cooperative_id')
      .eq('id', producerId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return notFoundResponse('Producer');
      }
      logError(fetchError, 'producers/update-fetch');
      return errorResponse('Failed to fetch producer', 500);
    }

    // Check access permissions
    if (!canAccessProducer(user, existingProducer.cooperative_id)) {
      return forbiddenResponse();
    }

    // Parse request body
    const body = await req.json();
    
    // Validate request data
    const validation = validateProducerUpdate(body);
    if (!validation.success) {
      const errors = getValidationErrors(validation);
      return validationErrorResponse(errors);
    }

    const updateData: UpdateProducerRequest = validation.data;

    // Check if phone number already exists (if being updated)
    if (updateData.phone) {
      const { data: existingProducerWithPhone } = await supabase
        .from('producers')
        .select('id')
        .eq('phone', updateData.phone)
        .neq('id', producerId)
        .single();

      if (existingProducerWithPhone) {
        return errorResponse('Producer with this phone number already exists', 409);
      }
    }

    // Update producer
    const { data: producer, error } = await supabase
      .from('producers')
      .update(updateData)
      .eq('id', producerId)
      .select()
      .single();

    if (error) {
      logError(error, 'producers/update');
      return errorResponse('Failed to update producer', 500);
    }

    const response = successResponse(producer, 'Producer updated successfully');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });

  } catch (error) {
    logError(error, 'producers/update');
    return errorResponse('Failed to update producer', 500);
  }
}

async function handleDeleteProducer(producerId: string, user: any) {
  try {
    // Check if user can delete data
    if (!canDeleteData(user)) {
      return forbiddenResponse();
    }

    // Get existing producer to check permissions
    const { data: existingProducer, error: fetchError } = await supabase
      .from('producers')
      .select('cooperative_id')
      .eq('id', producerId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return notFoundResponse('Producer');
      }
      logError(fetchError, 'producers/delete-fetch');
      return errorResponse('Failed to fetch producer', 500);
    }

    // Check access permissions
    if (!canAccessProducer(user, existingProducer.cooperative_id)) {
      return forbiddenResponse();
    }

    // Check if producer has associated plots
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('id')
      .eq('producer_id', producerId)
      .limit(1);

    if (plotsError) {
      logError(plotsError, 'producers/delete-check-plots');
      return errorResponse('Failed to check producer associations', 500);
    }

    if (plots && plots.length > 0) {
      return errorResponse('Cannot delete producer with associated plots. Please delete plots first.', 409);
    }

    // Delete producer
    const { error } = await supabase
      .from('producers')
      .delete()
      .eq('id', producerId);

    if (error) {
      logError(error, 'producers/delete');
      return errorResponse('Failed to delete producer', 500);
    }

    const response = successResponse(null, 'Producer deleted successfully');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });

  } catch (error) {
    logError(error, 'producers/delete');
    return errorResponse('Failed to delete producer', 500);
  }
}
