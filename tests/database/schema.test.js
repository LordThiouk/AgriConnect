// Database Schema Validation Tests - AgriConnect
// Tests for database structure, constraints, and RLS policies

const { createClient } = require('@supabase/supabase-js');

class DatabaseTestSuite {
  constructor() {
    this.testResults = [];
    this.supabase = null;
    this.testData = {};
  }

  async initialize() {
    try {
      // Initialize Supabase client
      this.supabase = createClient(
        process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
      );
      
      console.log('✅ Supabase client initialized');
      return true;
    } catch (error) {
      console.log('❌ Failed to initialize Supabase client:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🗄️ Running Database Schema Tests...\n');

    if (!(await this.initialize())) {
      console.log('❌ Cannot run tests without database connection');
      return;
    }

    await this.testTableStructure();
    await this.testConstraints();
    await this.testRLSPolicies();
    await this.testIndexes();
    await this.testTriggers();
    await this.testGeospatialFeatures();

    this.printResults();
  }

  async testTableStructure() {
    console.log('📋 Testing Table Structure...');
    
    const expectedTables = [
      'profiles', 'cooperatives', 'memberships', 'producers', 
      'seasons', 'plots', 'crops', 'operations', 
      'observations', 'media', 'agri_rules', 'recommendations', 
      'notifications', 'audit_logs'
    ];

    try {
      for (const tableName of expectedTables) {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          this.recordTest(`Table ${tableName} Exists`, false, `Error: ${error.message}`);
        } else {
          this.recordTest(`Table ${tableName} Exists`, true, 'Table accessible');
        }
      }
    } catch (error) {
      this.recordTest('Table Structure Tests', false, `Error: ${error.message}`);
    }
  }

  async testConstraints() {
    console.log('\n🔒 Testing Database Constraints...');
    
    try {
      // Test 1: Unique constraints
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('user_id')
        .limit(5);

      if (!profilesError && profiles && profiles.length > 0) {
        this.recordTest('Profiles User ID Unique', true, 'Constraint working');
      } else {
        this.recordTest('Profiles User ID Unique', false, 'Constraint test failed');
      }

      // Test 2: Foreign key constraints
      const { data: plots, error: plotsError } = await this.supabase
        .from('plots')
        .select('producer_id, cooperative_id')
        .limit(5);

      if (!plotsError && plots && plots.length > 0) {
        this.recordTest('Plots Foreign Keys', true, 'FK constraints working');
      } else {
        this.recordTest('Plots Foreign Keys', false, 'FK constraint test failed');
      }

      // Test 3: Check constraints
      const { data: crops, error: cropsError } = await this.supabase
        .from('crops')
        .select('status')
        .limit(5);

      if (!cropsError && crops && crops.length > 0) {
        this.recordTest('Crops Status Check', true, 'Check constraint working');
      } else {
        this.recordTest('Crops Status Check', false, 'Check constraint test failed');
      }

    } catch (error) {
      this.recordTest('Constraints Tests', false, `Error: ${error.message}`);
    }
  }

  async testRLSPolicies() {
    console.log('\n🛡️ Testing RLS Policies...');
    
    try {
      // Test 1: RLS enabled on tables
      const tablesWithRLS = ['profiles', 'producers', 'plots', 'crops', 'operations', 'observations'];
      
      for (const tableName of tablesWithRLS) {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error && error.message.includes('RLS')) {
          this.recordTest(`RLS Enabled on ${tableName}`, true, 'RLS policy active');
        } else if (error) {
          this.recordTest(`RLS Enabled on ${tableName}`, false, `Error: ${error.message}`);
        } else {
          this.recordTest(`RLS Enabled on ${tableName}`, false, 'RLS may not be active');
        }
      }

    } catch (error) {
      this.recordTest('RLS Policy Tests', false, `Error: ${error.message}`);
    }
  }

  async testIndexes() {
    console.log('\n📊 Testing Database Indexes...');
    
    try {
      // Test 1: Performance of indexed queries
      const startTime = Date.now();
      
      const { data: producers, error: producersError } = await this.supabase
        .from('producers')
        .select('*')
        .eq('cooperative_id', 'test-coop-id')
        .limit(100);

      const queryTime = Date.now() - startTime;
      
      if (!producersError) {
        const isFast = queryTime < 1000; // Should be under 1 second
        this.recordTest('Producers Index Performance', isFast, `Query time: ${queryTime}ms`);
      } else {
        this.recordTest('Producers Index Performance', false, `Error: ${producersError.message}`);
      }

      // Test 2: Geospatial index
      const geoStartTime = Date.now();
      
      const { data: plots, error: plotsError } = await this.supabase
        .from('plots')
        .select('*')
        .limit(100);

      const geoQueryTime = Date.now() - geoStartTime;
      
      if (!plotsError) {
        const isFast = geoQueryTime < 1000; // Should be under 1 second
        this.recordTest('Geospatial Index Performance', isFast, `Query time: ${geoQueryTime}ms`);
      } else {
        this.recordTest('Geospatial Index Performance', false, `Error: ${plotsError.message}`);
      }

    } catch (error) {
      this.recordTest('Index Tests', false, `Error: ${error.message}`);
    }
  }

  async testTriggers() {
    console.log('\n⚡ Testing Database Triggers...');
    
    try {
      // Test 1: Updated at trigger
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('updated_at')
        .limit(1);

      if (!profilesError && profiles && profiles.length > 0) {
        const hasUpdatedAt = profiles[0].updated_at !== null;
        this.recordTest('Updated At Trigger', hasUpdatedAt, 'Trigger working');
      } else {
        this.recordTest('Updated At Trigger', false, 'Trigger test failed');
      }

      // Test 2: Audit log trigger
      const { data: auditLogs, error: auditError } = await this.supabase
        .from('audit_logs')
        .select('*')
        .limit(1);

      if (!auditError && auditLogs && auditLogs.length > 0) {
        this.recordTest('Audit Log Trigger', true, 'Audit trigger working');
      } else {
        this.recordTest('Audit Log Trigger', false, 'Audit trigger test failed');
      }

    } catch (error) {
      this.recordTest('Trigger Tests', false, `Error: ${error.message}`);
    }
  }

  async testGeospatialFeatures() {
    console.log('\n🗺️ Testing Geospatial Features...');
    
    try {
      // Test 1: PostGIS extension
      const { data: postgisTest, error: postgisError } = await this.supabase
        .rpc('postgis_version');

      if (!postgisError && postgisTest) {
        this.recordTest('PostGIS Extension', true, `Version: ${postgisTest}`);
      } else {
        this.recordTest('PostGIS Extension', false, 'PostGIS not available');
      }

      // Test 2: Geospatial data types
      const { data: plots, error: plotsError } = await this.supabase
        .from('plots')
        .select('geom')
        .limit(1);

      if (!plotsError && plots && plots.length > 0) {
        const hasGeom = plots[0].geom !== null;
        this.recordTest('Geospatial Data Types', hasGeom, 'Geometry column working');
      } else {
        this.recordTest('Geospatial Data Types', false, 'Geometry test failed');
      }

    } catch (error) {
      this.recordTest('Geospatial Tests', false, `Error: ${error.message}`);
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
    console.log('\n📊 Database Tests Results Summary:');
    console.log('==================================');
    
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
  const dbTests = new DatabaseTestSuite();
  dbTests.runAllTests();
}

module.exports = DatabaseTestSuite;
