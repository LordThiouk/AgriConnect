// Authentication API - POST /auth/login

import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  corsHeaders,
  handleCors,
  logRequest,
  logError
} from '../shared/utils.ts';
import { validateLogin, getValidationErrors } from '../shared/validation.ts';
import { supabase } from '../shared/utils.ts';
import type { LoginRequest, LoginResponse } from '../shared/types.ts';

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const method = req.method;

    logRequest(method, url.pathname);

    if (method === 'POST') {
      // POST /auth/login - Login with phone and OTP
      return await handleLogin(req);
    } else {
      return errorResponse('Method not allowed', 405);
    }
  } catch (error) {
    logError(error, 'auth/login');
    return errorResponse('Internal server error', 500);
  }
});

async function handleLogin(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request data
    const validation = validateLogin(body);
    if (!validation.success) {
      const errors = getValidationErrors(validation);
      return validationErrorResponse(errors);
    }

    const loginData: LoginRequest = validation.data;

    // Check if user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, cooperative')
      .eq('user_id', loginData.phone) // Using phone as user_id for now
      .single();

    if (profileError || !profile) {
      return errorResponse('Invalid phone number or OTP', 401);
    }

    // In a real implementation, you would verify the OTP here
    // For now, we'll simulate OTP verification
    // TODO: Integrate with Twilio or similar service for OTP verification
    
    // For development/testing, accept any 6-digit OTP
    if (loginData.otp.length !== 6 || !/^\d{6}$/.test(loginData.otp)) {
      return errorResponse('Invalid OTP format', 400);
    }

    // Generate JWT token (in production, this would be handled by Supabase Auth)
    // For now, we'll create a simple token structure
    const token = generateSimpleToken(profile.id, profile.role);
    
    // Set token expiration (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const response: LoginResponse = {
      token,
      user: {
        id: profile.id,
        role: profile.role,
        cooperative_id: profile.cooperative
      },
      expires_at: expiresAt.toISOString()
    };

    return new Response(JSON.stringify(successResponse(response, 'Login successful')), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });

  } catch (error) {
    logError(error, 'auth/login');
    return errorResponse('Failed to process login', 500);
  }
}

// Simple token generation for development
// In production, use Supabase Auth or a proper JWT library
function generateSimpleToken(userId: string, role: string): string {
  const payload = {
    sub: userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // Simple base64 encoding for development
  // In production, use proper JWT signing
  return btoa(JSON.stringify(payload));
}
