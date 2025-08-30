// OTP Verification API - POST /auth/verify-otp

import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  corsHeaders,
  handleCors,
  logRequest,
  logError
} from '../shared/utils.ts';
import { validateVerifyOtp, getValidationErrors } from '../shared/validation.ts';
import { supabase } from '../shared/utils.ts';
import type { VerifyOtpRequest, VerifyOtpResponse } from '../shared/types.ts';

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const method = req.method;

    logRequest(method, url.pathname);

    if (method === 'POST') {
      // POST /auth/verify-otp - Send OTP to phone number
      return await handleVerifyOtp(req);
    } else {
      return errorResponse('Method not allowed', 405);
    }
  } catch (error) {
    logError(error, 'auth/verify-otp');
    return errorResponse('Internal server error', 500);
  }
});

async function handleVerifyOtp(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request data
    const validation = validateVerifyOtp(body);
    if (!validation.success) {
      const errors = getValidationErrors(validation);
      return validationErrorResponse(errors);
    }

    const verifyData: VerifyOtpRequest = validation.data;

    // Check if user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, cooperative_id')
      .eq('phone', verifyData.phone)
      .single();

    if (profileError || !profile) {
      return errorResponse('Phone number not found', 404);
    }

    // Generate OTP (6 digits)
    const otp = generateOTP();
    
    // In a real implementation, you would send the OTP via SMS here
    // For now, we'll log it for development purposes
    console.log(`OTP for ${verifyData.phone}: ${otp}`);
    
    // TODO: Integrate with Twilio or similar service for SMS sending
    // Example Twilio integration:
    // await sendSMS(verifyData.phone, `Your AgriConnect OTP is: ${otp}`);

    // Store OTP in database for verification (optional, for development)
    // In production, you might use Redis or similar for OTP storage
    const { error: otpError } = await supabase
      .from('notifications')
      .insert([{
        profile_id: profile.id,
        title: 'OTP Code',
        body: `Your OTP code is: ${otp}`,
        channel: 'sms',
        status: 'sent'
      }]);

    if (otpError) {
      logError(otpError, 'auth/verify-otp-store');
      // Don't fail the request if OTP storage fails
    }

    const response: VerifyOtpResponse = {
      success: true,
      message: 'OTP sent successfully'
    };

    return new Response(JSON.stringify(successResponse(response, 'OTP sent successfully')), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });

  } catch (error) {
    logError(error, 'auth/verify-otp');
    return errorResponse('Failed to send OTP', 500);
  }
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Example SMS sending function (to be implemented with Twilio)
async function sendSMS(phone: string, message: string): Promise<void> {
  // TODO: Implement Twilio SMS sending
  // const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  // const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  // const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');
  
  // const client = new Twilio(accountSid, authToken);
  // await client.messages.create({
  //   body: message,
  //   from: fromNumber,
  //   to: phone
  // });
  
  console.log(`SMS to ${phone}: ${message}`);
}
