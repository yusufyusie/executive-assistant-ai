#!/bin/bash

# Executive Assistant AI - Comprehensive Endpoint Testing Script
# This script tests all endpoints with dynamic configuration and quality validation

# Configuration
API_BASE="${API_BASE:-http://localhost:3000}"
API_KEY="${API_KEY:-dev_api_key_change_in_production}"
OUTPUT_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$OUTPUT_DIR/test_log_$TIMESTAMP.log"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$OUTPUT_DIR/test_log_$TIMESTAMP.log"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$OUTPUT_DIR/test_log_$TIMESTAMP.log"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$OUTPUT_DIR/test_log_$TIMESTAMP.log"
}

# Test function with quality validation
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local description="$5"
    
    log "Testing: $description"
    log "Endpoint: $method $endpoint"
    
    # Build curl command
    local curl_cmd="curl -s -w '%{http_code}|%{time_total}|%{size_download}' -X $method"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    curl_cmd="$curl_cmd -H 'X-API-Key: $API_KEY'"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$API_BASE$endpoint'"
    
    # Execute request
    local response=$(eval $curl_cmd)
    local status_code=$(echo "$response" | tail -c 20 | cut -d'|' -f1)
    local response_time=$(echo "$response" | tail -c 20 | cut -d'|' -f2)
    local response_size=$(echo "$response" | tail -c 20 | cut -d'|' -f3)
    local response_body=$(echo "$response" | sed 's/|[^|]*|[^|]*|[^|]*$//')
    
    # Quality validation
    local quality_score=0
    
    # Status code validation
    if [ "$status_code" = "$expected_status" ]; then
        success "Status Code: $status_code (Expected: $expected_status)"
        quality_score=$((quality_score + 25))
    else
        error "Status Code: $status_code (Expected: $expected_status)"
    fi
    
    # Response time validation (< 2 seconds for good quality)
    local response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d'.' -f1)
    if [ "$response_time_ms" -lt 2000 ]; then
        success "Response Time: ${response_time}s (${response_time_ms}ms)"
        quality_score=$((quality_score + 25))
    else
        warning "Response Time: ${response_time}s (${response_time_ms}ms) - Slow"
        quality_score=$((quality_score + 10))
    fi
    
    # Response size validation
    if [ "$response_size" -gt 0 ]; then
        success "Response Size: $response_size bytes"
        quality_score=$((quality_score + 25))
    else
        error "Response Size: $response_size bytes - Empty response"
    fi
    
    # JSON validation
    if echo "$response_body" | jq . >/dev/null 2>&1; then
        success "Valid JSON Response"
        quality_score=$((quality_score + 25))
    else
        error "Invalid JSON Response"
        echo "Response Body: $response_body"
    fi
    
    # Calculate quality rating
    local quality_stars=""
    if [ "$quality_score" -ge 90 ]; then
        quality_stars="⭐⭐⭐⭐⭐"
    elif [ "$quality_score" -ge 75 ]; then
        quality_stars="⭐⭐⭐⭐"
    elif [ "$quality_score" -ge 50 ]; then
        quality_stars="⭐⭐⭐"
    elif [ "$quality_score" -ge 25 ]; then
        quality_stars="⭐⭐"
    else
        quality_stars="⭐"
    fi
    
    log "Quality Score: $quality_score/100 $quality_stars"
    
    # Save detailed results
    cat > "$OUTPUT_DIR/test_${endpoint//\//_}_$TIMESTAMP.json" << EOF
{
  "endpoint": "$endpoint",
  "method": "$method",
  "description": "$description",
  "timestamp": "$(date -Iseconds)",
  "results": {
    "statusCode": $status_code,
    "expectedStatus": $expected_status,
    "responseTime": $response_time,
    "responseSize": $response_size,
    "qualityScore": $quality_score,
    "qualityStars": "$quality_stars"
  },
  "response": $response_body
}
EOF
    
    echo "----------------------------------------"
}

# Start testing
log "🚀 Starting Executive Assistant AI Endpoint Testing"
log "API Base URL: $API_BASE"
log "Output Directory: $OUTPUT_DIR"

# Test Application Core Endpoints
log "📱 Testing Application Core Endpoints"

test_endpoint "GET" "/" "" "200" "Application Information"
test_endpoint "GET" "/health" "" "200" "System Health Check"
test_endpoint "GET" "/features" "" "200" "Feature Discovery"

# Test AI Assistant Endpoints
log "🤖 Testing AI Assistant Endpoints"

test_endpoint "POST" "/api/assistant/process" '{
  "input": "Schedule a meeting with the team tomorrow at 2 PM",
  "context": {
    "userId": "test_user",
    "timezone": "America/New_York"
  }
}' "200" "AI Natural Language Processing"

test_endpoint "GET" "/api/assistant/briefing" "" "200" "Daily Briefing Generation"

test_endpoint "POST" "/api/assistant/analyze" '{
  "content": "This is a test email content for analysis",
  "type": "email",
  "analysisOptions": {
    "sentiment": true,
    "actionItems": true,
    "urgency": true
  }
}' "200" "AI Content Analysis"

# Test Calendar Management Endpoints
log "📅 Testing Calendar Management Endpoints"

test_endpoint "GET" "/api/calendar/events" "" "200" "Retrieve Calendar Events"

test_endpoint "POST" "/api/calendar/schedule" '{
  "title": "Test Meeting",
  "description": "Automated test meeting",
  "startTime": "2025-08-20T14:00:00-04:00",
  "endTime": "2025-08-20T15:00:00-04:00",
  "attendees": ["test@example.com"],
  "location": "Conference Room A"
}' "201" "Schedule New Meeting"

test_endpoint "POST" "/api/calendar/intelligent-schedule" '{
  "title": "AI Scheduled Meeting",
  "duration": 60,
  "attendees": ["team@example.com"],
  "preferences": {
    "timeRange": {"start": "09:00", "end": "17:00"},
    "timezone": "America/New_York"
  }
}' "200" "AI-Powered Intelligent Scheduling"

test_endpoint "POST" "/api/calendar/availability" '{
  "startDate": "2025-08-20T09:00:00-04:00",
  "endDate": "2025-08-20T17:00:00-04:00",
  "attendees": ["test@example.com"],
  "duration": 60
}' "200" "Check Availability"

test_endpoint "GET" "/api/calendar/analytics" "" "200" "Calendar Analytics"

# Test Email Automation Endpoints
log "📧 Testing Email Automation Endpoints"

test_endpoint "GET" "/api/email/templates" "" "200" "Email Templates"

test_endpoint "POST" "/api/email/send" '{
  "to": ["test@example.com"],
  "subject": "Test Email from API",
  "content": "<h1>Test Email</h1><p>This is a test email sent via API.</p>",
  "options": {
    "trackOpens": true,
    "trackClicks": true
  }
}' "200" "Send Email"

test_endpoint "POST" "/api/email/send-template" '{
  "to": "test@example.com",
  "templateId": "meeting-confirmation",
  "variables": {
    "attendeeName": "Test User",
    "title": "Test Meeting",
    "startTime": "Tomorrow at 2:00 PM"
  }
}' "200" "Send Templated Email"

test_endpoint "GET" "/api/email/analytics" "" "200" "Email Analytics"

# Test Task Management Endpoints
log "✅ Testing Task Management Endpoints"

test_endpoint "GET" "/api/tasks" "" "200" "Retrieve Tasks"

test_endpoint "POST" "/api/tasks" '{
  "title": "Test Task from API",
  "description": "This is a test task created via API testing",
  "priority": "high",
  "tags": ["test", "api", "automation"],
  "dueDate": "2025-08-25T17:00:00-04:00"
}' "201" "Create New Task"

test_endpoint "GET" "/api/tasks/priority" "" "200" "Priority Tasks"

test_endpoint "POST" "/api/tasks/smart-prioritize" '{}' "200" "AI Task Prioritization"

test_endpoint "GET" "/api/tasks/analytics" "" "200" "Task Analytics"

# Test Proactive Automation Endpoints
log "⚡ Testing Proactive Automation Endpoints"

test_endpoint "GET" "/api/automation/briefing" "" "200" "Automation Daily Briefing"

test_endpoint "POST" "/api/automation/trigger" '{
  "actionType": "daily_briefing",
  "context": {}
}' "200" "Trigger Automation"

test_endpoint "GET" "/api/automation/status" "" "200" "Automation Status"

test_endpoint "GET" "/api/automation/analytics" "" "200" "Automation Analytics"

# Test Configuration Endpoints
log "🔧 Testing Configuration & Monitoring Endpoints"

test_endpoint "GET" "/metrics" "" "200" "Prometheus Metrics"

# Generate summary report
log "📊 Generating Test Summary Report"

# Count results
total_tests=$(find "$OUTPUT_DIR" -name "test_*.json" -newer "$OUTPUT_DIR/test_log_$TIMESTAMP.log" | wc -l)
passed_tests=$(grep -c "✅" "$OUTPUT_DIR/test_log_$TIMESTAMP.log")
failed_tests=$(grep -c "❌" "$OUTPUT_DIR/test_log_$TIMESTAMP.log")
warnings=$(grep -c "⚠️" "$OUTPUT_DIR/test_log_$TIMESTAMP.log")

# Calculate average quality score
avg_quality=$(find "$OUTPUT_DIR" -name "test_*.json" -newer "$OUTPUT_DIR/test_log_$TIMESTAMP.log" -exec jq -r '.results.qualityScore' {} \; | awk '{sum+=$1; count++} END {print sum/count}')

# Generate summary
cat > "$OUTPUT_DIR/summary_$TIMESTAMP.json" << EOF
{
  "testSuite": "Executive Assistant AI - Endpoint Testing",
  "timestamp": "$(date -Iseconds)",
  "summary": {
    "totalTests": $total_tests,
    "passedTests": $passed_tests,
    "failedTests": $failed_tests,
    "warnings": $warnings,
    "averageQualityScore": $avg_quality,
    "successRate": $(echo "scale=2; $passed_tests * 100 / $total_tests" | bc -l)
  },
  "configuration": {
    "apiBase": "$API_BASE",
    "outputDirectory": "$OUTPUT_DIR"
  }
}
EOF

# Display summary
echo ""
log "🎯 TEST SUMMARY REPORT"
log "======================"
log "Total Tests: $total_tests"
success "Passed: $passed_tests"
error "Failed: $failed_tests"
warning "Warnings: $warnings"
log "Average Quality Score: $(printf "%.1f" $avg_quality)/100"
log "Success Rate: $(echo "scale=1; $passed_tests * 100 / $total_tests" | bc -l)%"
log ""
log "📁 Detailed results saved in: $OUTPUT_DIR"
log "📋 Summary report: $OUTPUT_DIR/summary_$TIMESTAMP.json"
log "📝 Full log: $OUTPUT_DIR/test_log_$TIMESTAMP.log"

# Final status
if [ "$failed_tests" -eq 0 ]; then
    success "🎉 ALL TESTS PASSED! Executive Assistant AI endpoints are fully functional."
else
    error "⚠️  Some tests failed. Please review the detailed logs for troubleshooting."
fi

echo ""
log "✨ Executive Assistant AI Endpoint Testing Complete!"
