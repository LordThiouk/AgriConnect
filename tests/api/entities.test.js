// Agricultural Entities API Tests - AgriConnect
// Tests for producers, plots, crops, operations, and observations

const API_BASE_URL = process.env.API_BASE_URL || 'https://your-project-ref.supabase.co/functions/v1';

class EntitiesTestSuite {
  constructor() {
    this.testResults = [];
    this.authToken = null;
    this.testData = {
      producer: null,
      plot: null,
      crop: null,
      operation: null,
      observation: null
    };
  }

  async runAllTests() {
    console.log('🌾 Running Agricultural Entities API Tests...\n');

    // First authenticate to get token
    await this.authenticate();
    
    if (!this.authToken) {
      console.log('❌ Authentication failed, skipping entity tests');
      return;
    }

    await this.testProducers();
    await this.testPlots();
    await this.testCrops();
    await this.testOperations();
    await this.testObservations();
    await this.testRelationships();

    this.printResults();
  }

  async authenticate() {
    console.log('🔐 Authenticating for entity tests...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'test@agriconnect.sn', 
          password: 'test123' 
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.authToken = data.data?.token;
        console.log('✅ Authentication successful');
      } else {
        console.log('❌ Authentication failed');
      }
    } catch (error) {
      console.log('❌ Authentication error:', error.message);
    }
  }

  async testProducers() {
    console.log('\n👥 Testing Producers API...');
    
    try {
      // Test 1: Create producer
      const createResponse = await fetch(`${API_BASE_URL}/api/producers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          full_name: 'Test Producer',
          phone: '+221701234567',
          cooperative_id: 'test-coop-id',
          region: 'Dakar',
          department: 'Dakar',
          commune: 'Dakar'
        })
      });
      
      if (createResponse.ok) {
        const producer = await createResponse.json();
        this.testData.producer = producer.data;
        this.recordTest('Create Producer', true, `ID: ${producer.data.id}`);
      } else {
        this.recordTest('Create Producer', false, `Status: ${createResponse.status}`);
      }
      
      // Test 2: Get producers list
      const listResponse = await fetch(`${API_BASE_URL}/api/producers`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      this.recordTest('List Producers', listResponse.ok, `Status: ${listResponse.status}`);
      
      // Test 3: Get single producer
      if (this.testData.producer) {
        const getResponse = await fetch(`${API_BASE_URL}/api/producers/${this.testData.producer.id}`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        
        this.recordTest('Get Producer', getResponse.ok, `Status: ${getResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('Producers Tests', false, `Error: ${error.message}`);
    }
  }

  async testPlots() {
    console.log('\n🏞️ Testing Plots API...');
    
    if (!this.testData.producer) {
      this.recordTest('Plots Tests', false, 'No producer available');
      return;
    }
    
    try {
      // Test 1: Create plot
      const createResponse = await fetch(`${API_BASE_URL}/api/plots`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          name: 'Test Plot',
          producer_id: this.testData.producer.id,
          cooperative_id: 'test-coop-id',
          area_hectares: 2.5,
          soil_type: 'sandy_loam',
          water_source: 'rain',
          status: 'active',
          geom: 'POINT(-17.4441 14.7167)' // Dakar coordinates
        })
      });
      
      if (createResponse.ok) {
        const plot = await createResponse.json();
        this.testData.plot = plot.data;
        this.recordTest('Create Plot', true, `ID: ${plot.data.id}`);
      } else {
        this.recordTest('Create Plot', false, `Status: ${createResponse.status}`);
      }
      
      // Test 2: Get plots list
      const listResponse = await fetch(`${API_BASE_URL}/api/plots`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      this.recordTest('List Plots', listResponse.ok, `Status: ${listResponse.status}`);
      
    } catch (error) {
      this.recordTest('Plots Tests', false, `Error: ${error.message}`);
    }
  }

  async testCrops() {
    console.log('\n🌱 Testing Crops API...');
    
    if (!this.testData.plot) {
      this.recordTest('Crops Tests', false, 'No plot available');
      return;
    }
    
    try {
      // Test 1: Create crop
      const createResponse = await fetch(`${API_BASE_URL}/api/crops`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          plot_id: this.testData.plot.id,
          season_id: 'test-season-id',
          crop_type: 'maize',
          variety: 'Local Maize',
          sowing_date: new Date().toISOString(),
          expected_harvest_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'en_cours'
        })
      });
      
      if (createResponse.ok) {
        const crop = await createResponse.json();
        this.testData.crop = crop.data;
        this.recordTest('Create Crop', true, `ID: ${crop.data.id}`);
      } else {
        this.recordTest('Create Crop', false, `Status: ${createResponse.status}`);
      }
      
      // Test 2: Get crops list
      const listResponse = await fetch(`${API_BASE_URL}/api/crops`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      this.recordTest('List Crops', listResponse.ok, `Status: ${listResponse.status}`);
      
    } catch (error) {
      this.recordTest('Crops Tests', false, `Error: ${error.message}`);
    }
  }

  async testOperations() {
    console.log('\n🔧 Testing Operations API...');
    
    if (!this.testData.crop) {
      this.recordTest('Operations Tests', false, 'No crop available');
      return;
    }
    
    try {
      // Test 1: Create operation
      const createResponse = await fetch(`${API_BASE_URL}/api/operations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          crop_id: this.testData.crop.id,
          op_type: 'fertilization',
          op_date: new Date().toISOString(),
          product_used: 'NPK 15-15-15',
          dose: '200 kg/ha',
          notes: 'Test fertilization operation'
        })
      });
      
      if (createResponse.ok) {
        const operation = await createResponse.json();
        this.testData.operation = operation.data;
        this.recordTest('Create Operation', true, `ID: ${operation.data.id}`);
      } else {
        this.recordTest('Create Operation', false, `Status: ${createResponse.status}`);
      }
      
      // Test 2: Get operations list
      const listResponse = await fetch(`${API_BASE_URL}/api/operations`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      this.recordTest('List Operations', listResponse.ok, `Status: ${listResponse.status}`);
      
    } catch (error) {
      this.recordTest('Operations Tests', false, `Error: ${error.message}`);
    }
  }

  async testObservations() {
    console.log('\n👁️ Testing Observations API...');
    
    if (!this.testData.crop) {
      this.recordTest('Observations Tests', false, 'No crop available');
      return;
    }
    
    try {
      // Test 1: Create observation
      const createResponse = await fetch(`${API_BASE_URL}/api/observations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          crop_id: this.testData.crop.id,
          obs_date: new Date().toISOString(),
          emergence_percent: 85,
          pest_disease: 'none',
          severity: 1,
          notes: 'Good crop emergence observed'
        })
      });
      
      if (createResponse.ok) {
        const observation = await createResponse.json();
        this.testData.observation = observation.data;
        this.recordTest('Create Observation', true, `ID: ${observation.data.id}`);
      } else {
        this.recordTest('Create Observation', false, `Status: ${createResponse.status}`);
      }
      
      // Test 2: Get observations list
      const listResponse = await fetch(`${API_BASE_URL}/api/observations`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      
      this.recordTest('List Observations', listResponse.ok, `Status: ${listResponse.status}`);
      
    } catch (error) {
      this.recordTest('Observations Tests', false, `Error: ${error.message}`);
    }
  }

  async testRelationships() {
    console.log('\n🔗 Testing Entity Relationships...');
    
    try {
      // Test 1: Producer with plots
      if (this.testData.producer) {
        const plotsResponse = await fetch(`${API_BASE_URL}/api/producers/${this.testData.producer.id}/plots`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        
        this.recordTest('Producer Plots Relationship', plotsResponse.ok, `Status: ${plotsResponse.status}`);
      }
      
      // Test 2: Plot with crops
      if (this.testData.plot) {
        const cropsResponse = await fetch(`${API_BASE_URL}/api/plots/${this.testData.plot.id}/crops`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        
        this.recordTest('Plot Crops Relationship', cropsResponse.ok, `Status: ${cropsResponse.status}`);
      }
      
      // Test 3: Crop with operations
      if (this.testData.crop) {
        const operationsResponse = await fetch(`${API_BASE_URL}/api/crops/${this.testData.crop.id}/operations`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        
        this.recordTest('Crop Operations Relationship', operationsResponse.ok, `Status: ${operationsResponse.status}`);
      }
      
    } catch (error) {
      this.recordTest('Relationship Tests', false, `Error: ${error.message}`);
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
    console.log('\n📊 Entity Tests Results Summary:');
    console.log('================================');
    
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
  const entityTests = new EntitiesTestSuite();
  entityTests.runAllTests();
}

module.exports = EntitiesTestSuite;
