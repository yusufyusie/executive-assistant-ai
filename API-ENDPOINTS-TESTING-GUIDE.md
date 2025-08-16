# 🔌 Complete API Endpoints & Testing Guide

## 📋 **ALL AVAILABLE ENDPOINTS**

### **🏠 Application Level Endpoints**
```
GET  /                     - Application information
GET  /health               - System health check
GET  /features             - Feature flags status
GET  /metrics              - Performance metrics
GET  /apis                 - API integration status
GET  /test-apis            - Test all API connections
GET  /api/docs             - Swagger documentation
```

### **🤖 Executive Assistant Endpoints**
```
POST /api/assistant/process      - Process natural language requests
GET  /api/assistant/briefing     - Generate daily briefing
GET  /api/assistant/capabilities - Get assistant capabilities
GET  /api/assistant/health       - Assistant service health
```

### **📅 Calendar Management Endpoints**
```
GET  /api/calendar/events              - Get calendar events
POST /api/calendar/schedule            - Schedule new event
GET  /api/calendar/availability        - Check availability
POST /api/calendar/intelligent-schedule - Smart scheduling
GET  /api/calendar/health              - Calendar service health
```

### **📧 Email Automation Endpoints**
```
POST /api/email/send          - Send email
POST /api/email/send-template - Send templated email
GET  /api/email/templates     - Get email templates
GET  /api/email/health        - Email service health
```

### **📋 Task Management Endpoints**
```
GET    /api/tasks                    - Get all tasks
GET    /api/tasks/:id                - Get specific task
POST   /api/tasks                    - Create new task
PUT    /api/tasks/:id                - Update task
DELETE /api/tasks/:id                - Delete task
POST   /api/tasks/prioritize         - AI-powered prioritization
GET    /api/tasks/priority/:priority - Get tasks by priority
GET    /api/tasks/status/:status     - Get tasks by status
GET    /api/tasks/overdue            - Get overdue tasks
GET    /api/tasks/analytics          - Task analytics
```

### **🔄 Automation Endpoints**
```
POST /api/automation/trigger   - Trigger automation
GET  /api/automation/briefing  - Get automation briefing
GET  /api/automation/status    - Automation status
POST /api/automation/schedule  - Schedule automation
GET  /api/automation/analytics - Automation analytics
GET  /api/automation/health    - Automation service health
```

---

## 🧪 **STEP-BY-STEP TESTING GUIDE**

### **STEP 1: Start the Application**
```bash
# Navigate to project directory
cd executive-assistant-ai

# Install dependencies (if not done)
npm install

# Start the application
npm start

# You should see:
# [Nest] LOG [Bootstrap] 🚀 Executive Assistant AI started successfully!
# [Nest] LOG [Bootstrap] 🌐 Server running on: http://localhost:3000
```

### **STEP 2: Test Basic Health Endpoints**

#### **Test 1: Application Info**
```bash
curl http://localhost:3000/
```
**Expected Response:**
```json
{
  "name": "Executive Assistant AI",
  "version": "2.0.0",
  "description": "Enterprise-grade AI automation system",
  "environment": "development",
  "timestamp": "2025-01-16T10:30:00Z"
}
```

#### **Test 2: Health Check**
```bash
curl http://localhost:3000/health
```
**Expected Response:**
```json
{
  "status": "operational",
  "timestamp": "2025-01-16T10:30:00Z",
  "services": {
    "gemini": "operational",
    "calendar": "operational",
    "email": "operational",
    "database": "operational"
  },
  "uptime": 3600,
  "memory": {
    "used": "150MB",
    "total": "512MB"
  }
}
```

#### **Test 3: Features Status**
```bash
curl http://localhost:3000/features
```
**Expected Response:**
```json
{
  "aiProcessing": true,
  "calendarSync": true,
  "emailAutomation": true,
  "taskManagement": true,
  "proactiveAutomation": true,
  "analytics": true
}
```

### **STEP 3: Test AI Assistant (Main Feature)**

#### **Test 4: AI Request Processing**
```bash
curl -X POST http://localhost:3000/api/assistant/process \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Schedule a meeting with John tomorrow at 2 PM",
    "context": {
      "userId": "user123",
      "timezone": "UTC"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "intent": "schedule_meeting",
  "entities": {
    "person": "John",
    "time": "tomorrow at 2 PM",
    "action": "schedule"
  },
  "actions": [
    {
      "type": "calendar_event",
      "description": "Create meeting with John",
      "scheduled": true
    },
    {
      "type": "email_notification",
      "description": "Send meeting invitation",
      "sent": true
    }
  ],
  "response": "I've scheduled a meeting with John for tomorrow at 2 PM and sent the invitation.",
  "confidence": 0.95
}
```

#### **Test 5: Daily Briefing**
```bash
curl http://localhost:3000/api/assistant/briefing
```

**Expected Response:**
```json
{
  "date": "2025-01-16",
  "summary": "Daily Executive Briefing",
  "calendar": {
    "todayMeetings": 3,
    "upcomingDeadlines": 2,
    "conflicts": 0
  },
  "tasks": {
    "highPriority": 5,
    "overdue": 1,
    "completed": 8
  },
  "recommendations": [
    "Review quarterly budget proposal before 3 PM meeting",
    "Follow up with marketing team on campaign metrics"
  ]
}
```

### **STEP 4: Test Calendar Integration**

#### **Test 6: Get Calendar Events**
```bash
curl "http://localhost:3000/api/calendar/events?date=2025-01-16"
```

#### **Test 7: Schedule Event**
```bash
curl -X POST http://localhost:3000/api/calendar/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Standup",
    "startTime": "2025-01-17T09:00:00Z",
    "endTime": "2025-01-17T09:30:00Z",
    "attendees": ["team@company.com"]
  }'
```

### **STEP 5: Test Task Management**

#### **Test 8: Create Task**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review quarterly reports",
    "description": "Analyze Q4 performance metrics",
    "priority": "high",
    "dueDate": "2025-01-20T17:00:00Z"
  }'
```

#### **Test 9: Get All Tasks**
```bash
curl http://localhost:3000/api/tasks
```

#### **Test 10: AI Task Prioritization**
```bash
curl -X POST http://localhost:3000/api/tasks/prioritize \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": ["task1", "task2", "task3"],
    "context": {
      "deadline": "2025-01-18",
      "resources": "limited"
    }
  }'
```

### **STEP 6: Test Email Automation**

#### **Test 11: Send Email**
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Meeting Follow-up",
    "content": "Thank you for the productive meeting today.",
    "template": "follow-up"
  }'
```

### **STEP 7: Test Automation Features**

#### **Test 12: Trigger Automation**
```bash
curl -X POST http://localhost:3000/api/automation/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "type": "daily_briefing",
    "schedule": "immediate"
  }'
```

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **Current Implementation**
The system currently uses **development mode** without strict authentication for demonstration purposes. In production, it would include:

#### **JWT Authentication**
```typescript
// Example of protected endpoint
@UseGuards(JwtAuthGuard)
@Post('process')
async processRequest(@Request() req, @Body() dto: ProcessRequestDto) {
  // req.user contains authenticated user info
  return this.service.processRequest(dto, req.user);
}
```

#### **API Key Authentication**
```typescript
// Example of API key protection
@UseGuards(ApiKeyGuard)
@Get('sensitive-data')
async getSensitiveData(@Headers('x-api-key') apiKey: string) {
  // Validate API key
  return this.service.getSensitiveData();
}
```

### **For Testing (Development Mode)**
- No authentication required for demonstration
- All endpoints are publicly accessible
- In production: JWT tokens, API keys, OAuth 2.0

---

## 💾 **DATABASE & STORAGE**

### **Current Implementation: In-Memory Storage**
The system uses **in-memory storage** for demonstration:

```typescript
// src/infrastructure/persistence/in-memory/
├── task.repository.ts          # Task storage
├── calendar-event.repository.ts # Calendar events
├── email-template.repository.ts # Email templates
└── automation-log.repository.ts # Automation logs
```

### **Data Structure Examples**

#### **Task Entity**
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  assignee?: string;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Calendar Event**
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  description?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
}
```

### **Production Database Options**
For production deployment, the system supports:
- **PostgreSQL**: Relational data with TypeORM
- **MongoDB**: Document storage with Mongoose
- **Redis**: Caching and session storage
- **Cloud Storage**: Google Cloud Storage, AWS S3

---

## 🔄 **EXECUTION FLOW EXAMPLES**

### **Example 1: Complete AI Request Flow**

```
1. User Input: "I need to follow up with John about the project deadline"

2. HTTP Request:
   POST /api/assistant/process
   {
     "input": "I need to follow up with John about the project deadline",
     "context": { "userId": "user123" }
   }

3. Controller Processing:
   - AssistantController.processRequest()
   - Validates input using ValidationPipe
   - Calls AIAssistantService.processRequest()

4. AI Processing:
   - GeminiService.analyzeIntent()
   - Sends to Gemini AI: "Analyze this request..."
   - Receives: { intent: "follow_up", entities: { person: "John", topic: "project deadline" } }

5. Business Logic:
   - Determines actions needed: email + task creation
   - EmailService.sendFollowUp()
   - TaskService.createTask()

6. External API Calls:
   - SendGrid API: Send follow-up email
   - Calendar API: Check John's availability
   - Task storage: Create reminder task

7. Response Assembly:
   {
     "success": true,
     "actions": ["email_sent", "task_created"],
     "response": "I've sent a follow-up email to John and created a reminder task."
   }
```

### **Example 2: Proactive Automation Flow**

```
1. Cloud Scheduler Trigger: Every weekday at 8:00 AM

2. Automation Service:
   - AutomationService.generateDailyBriefing()
   - Collects data from all services

3. Data Gathering:
   - CalendarService.getTodayEvents()
   - TaskService.getHighPriorityTasks()
   - EmailService.getUnreadEmails()

4. AI Analysis:
   - GeminiService.generateBriefing()
   - Creates executive summary with insights

5. Email Delivery:
   - EmailService.sendBriefing()
   - SendGrid API sends formatted briefing

6. Logging:
   - AutomationLogRepository.save()
   - Records automation execution
```

---

## 🧪 **TESTING WITH POSTMAN/INSOMNIA**

### **Import Collection**
Create a Postman collection with these requests:

#### **Collection: Executive Assistant AI**
```json
{
  "info": {
    "name": "Executive Assistant AI",
    "description": "Complete API testing collection"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "AI Process Request",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/assistant/process",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "raw": "{\n  \"input\": \"Schedule a meeting with the engineering team next week\",\n  \"context\": {\n    \"userId\": \"user123\",\n    \"timezone\": \"UTC\"\n  }\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## 🎯 **QUICK TESTING CHECKLIST**

### **✅ Basic Functionality**
- [ ] Application starts successfully
- [ ] Health endpoint returns "operational"
- [ ] Swagger documentation accessible at /api/docs
- [ ] All 25+ endpoints respond without errors

### **✅ AI Features**
- [ ] AI request processing works
- [ ] Intent recognition functions correctly
- [ ] Daily briefing generation succeeds
- [ ] Response quality is professional

### **✅ Integrations**
- [ ] Calendar events can be retrieved
- [ ] Email sending functionality works
- [ ] Task creation and management operational
- [ ] Automation triggers execute properly

### **✅ Error Handling**
- [ ] Invalid requests return proper error messages
- [ ] Missing parameters are validated
- [ ] Service failures are handled gracefully
- [ ] Logs show appropriate error information

---

## 🚀 **READY FOR TESTING**

You now have a complete understanding of:
1. **System Architecture**: How all components work together
2. **API Endpoints**: All 25+ available endpoints
3. **Testing Procedures**: Step-by-step testing guide
4. **Data Flow**: Complete request/response cycles
5. **Storage**: In-memory data structures
6. **Authentication**: Current and production approaches

**Start testing with the health endpoint and work your way through the AI features!** 🧪✨
