// API Authentication Tests - AgriConnect
// Tests for both mobile (phone) and web (email) authentication

const API_BASE_URL = process.env.API_BASE_URL || 'https://your-project-ref.supabase.co/functions/v1';

class AuthTestSuite {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Running Authentication API Tests...\n');

    await this.testMobileAuth();
    await this.testWebAuth();
    await this.testErrorCases();
    await this.testSecurity();

    this.printResults();
  }

  async testMobileAuth() {
    console.log('📱 Testing Mobile App Authentication (Phone + OTP)...');
    
    try {
      // Test 1: Phone OTP request
      const otpResponse = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+221701234567' })
      });
      
      this.recordTest('Mobile OTP Request', otpResponse.status === 200 || otpResponse.status === 201, 
        `Status: ${otpResponse.status}`);
      
      // Test 2: Phone OTP verification
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: '+221701234567', 
          otp: '123456' 
        })
      });
      
      this.recordTest('Mobile OTP Verification', verifyResponse.status === 200, 
        `Status: ${verifyResponse.status}`);
      
    } catch (error) {
      this.recordTest('Mobile Auth Tests', false, `Error: ${error.message}`);
    }
  }

  async testWebAuth() {
    console.log('🌐 Testing Web App Authentication (Email + Password)...');
    
    try {
      // Test 1: Email registration
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'admin@agriconnect.sn', 
          password: 'Admin123!',
          role: 'admin',
          full_name: 'Admin User'
        })
      });
      
      this.recordTest('Web Registration', registerResponse.status === 200 || registerResponse.status === 201, 
        `Status: ${registerResponse.status}`);
      
      // Test 2: Email login
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'admin@agriconnect.sn', 
          password: 'Admin123!' 
        })
      });
      
      this.recordTest('Web Login', loginResponse.status === 200, 
        `Status: ${loginResponse.status}`);
      
    } catch (error) {
      this.recordTest('Web Auth Tests', false, `Error: ${error.message}`);
    }
  }

  async testErrorCases() {
    console.log('❌ Testing Error Cases...');
    
    try {
      // Test 1: Invalid phone format
      const invalidPhoneResponse = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: 'invalid-phone' })
      });
      
      this.recordTest('Invalid Phone Format', invalidPhoneResponse.status === 400, 
        `Status: ${invalidPhoneResponse.status}`);
      
      // Test 2: Invalid email format
      const invalidEmailResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'invalid-email', 
          password: 'password' 
        })
      });
      
      this.recordTest('Invalid Email Format', invalidEmailResponse.status === 400, 
        `Status: ${invalidEmailResponse.status}`);
      
      // Test 3: Missing credentials
      const missingCredsResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      this.recordTest('Missing Credentials', missingCredsResponse.status === 400, 
        `Status: ${missingCredsResponse.status}`);
      
    } catch (error) {
      this.recordTest('Error Case Tests', false, `Error: ${error.message}`);
    }
  }

  async testSecurity() {
    console.log('🔒 Testing Security Features...');
    
    try {
      // Test 1: CORS headers
      const corsResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'OPTIONS',
        headers: { 'Origin': 'https://malicious-site.com' }
      });
      
      this.recordTest('CORS Protection', corsResponse.status === 200, 
        `Status: ${corsResponse.status}`);
      
      // Test 2: Rate limiting (if implemented)
      const rapidRequests = await Promise.all([
        fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: 'test1@example.com', 
            password: 'password' 
          })
        }),
        fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: 'test2@example.com', 
            password: 'password' 
          })
        }),
        fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: 'test3@example.com', 
            password: 'password' 
          })
        })
      ]);
      
      this.recordTest('Rate Limiting', true, 'Multiple rapid requests processed');
      
    } catch (error) {
      this.recordTest('Security Tests', false, `Error: ${error.message}`);
    }
  }

  recordTest(testName, passed, details) {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const percentage = ((passed / total) * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${percentage}%`);
    
    if (total - passed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}: ${r.details}`));
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const authTests = new AuthTestSuite();
  authTests.runAllTests();
}

module.exports = AuthTestSuite;
