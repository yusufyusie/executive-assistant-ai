/**
 * Executive Assistant AI - Endpoint Testing Script
 * Run with: node test-endpoints.js
 */

const baseUrl = 'http://localhost:3000';

// Test function with error handling
async function testEndpoint(method, endpoint, data = null) {
  try {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log(`\n🧪 Testing ${method} ${endpoint}`);
    console.log('─'.repeat(50));

    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const result = await response.json();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));

    return { success: true, status: response.status, data: result };
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main testing function
async function runTests() {
  console.log('Executive Assistant AI - Endpoint Testing');
  console.log('='.repeat(60));

  // Test 1: Application Info
  await testEndpoint('GET', '/');

  // Test 2: Health Check
  await testEndpoint('GET', '/health');

  // Test 3: Features Status
  await testEndpoint('GET', '/features');

  // Test 4: System Metrics
  await testEndpoint('GET', '/metrics');

  // Test 5: API Status
  await testEndpoint('GET', '/apis');

  // Test 6: AI Assistant - Process Request
  await testEndpoint('POST', '/api/assistant/process', {
    input: 'Schedule a meeting with John tomorrow at 2 PM',
    context: {
      userId: 'user123',
      timezone: 'UTC'
    }
  });

  // Test 7: AI Assistant - Daily Briefing
  await testEndpoint('GET', '/api/assistant/briefing');

  // Test 8: AI Assistant - Capabilities
  await testEndpoint('GET', '/api/assistant/capabilities');

  // Test 9: Calendar - Get Events
  await testEndpoint('GET', '/api/calendar/events?date=2025-01-16');

  // Test 10: Calendar - Schedule Event
  await testEndpoint('POST', '/api/calendar/schedule', {
    title: 'Team Standup',
    startTime: '2025-01-17T09:00:00Z',
    endTime: '2025-01-17T09:30:00Z',
    attendees: ['team@company.com']
  });

  // Test 11: Tasks - Get All
  await testEndpoint('GET', '/api/tasks');

  // Test 12: Tasks - Create Task
  await testEndpoint('POST', '/api/tasks', {
    title: 'Review quarterly reports',
    description: 'Analyze Q4 performance metrics',
    priority: 'high',
    dueDate: '2025-01-20T17:00:00Z'
  });

  // Test 13: Tasks - AI Prioritization
  await testEndpoint('POST', '/api/tasks/prioritize', {
    tasks: ['task1', 'task2', 'task3'],
    context: {
      deadline: '2025-01-18',
      resources: 'limited'
    }
  });

  // Test 14: Email - Send Email
  await testEndpoint('POST', '/api/email/send', {
    to: 'recipient@example.com',
    subject: 'Meeting Follow-up',
    content: 'Thank you for the productive meeting today.',
    template: 'follow-up'
  });

  // Test 15: Email - Get Templates
  await testEndpoint('GET', '/api/email/templates');

  // Test 16: Automation - Trigger
  await testEndpoint('POST', '/api/automation/trigger', {
    type: 'daily_briefing',
    schedule: 'immediate'
  });

  // Test 17: Automation - Status
  await testEndpoint('GET', '/api/automation/status');

  // Test 18: Health Checks for All Services
  await testEndpoint('GET', '/api/assistant/health');
  await testEndpoint('GET', '/api/calendar/health');
  await testEndpoint('GET', '/api/email/health');
  await testEndpoint('GET', '/api/automation/health');

  console.log('\nTesting Complete!');
  console.log('='.repeat(60));
}

// Run the tests
runTests().catch(console.error);
