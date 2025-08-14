# Executive Assistant AI - API Documentation

## Base URL
```
Production: https://your-app-url.run.app
Development: http://localhost:3000
```

## Authentication
Currently, the API uses API key authentication. Include the API key in the header:
```
X-API-Key: your_api_key_here
```

## Core Endpoints

### 1. Application Info

#### GET /
Get application information and available endpoints.

**Response:**
```json
{
  "name": "Executive Assistant AI",
  "version": "1.0.0",
  "description": "AI-powered Executive Assistant automation platform",
  "environment": "development",
  "endpoints": {
    "ai": "/api/assistant",
    "calendar": "/api/calendar",
    "email": "/api/email",
    "tasks": "/api/tasks",
    "automation": "/api/automation"
  },
  "features": [
    "Natural Language Processing with Gemini AI",
    "Google Calendar Integration",
    "SendGrid Email Automation",
    "Intelligent Task Management",
    "Proactive Automation & Scheduling"
  ]
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-14T08:48:26.847Z",
  "uptime": 43.0647967,
  "services": {
    "ai": "operational",
    "calendar": "operational",
    "email": "operational",
    "tasks": "operational",
    "automation": "operational"
  }
}
```

### 2. AI Assistant

#### POST /api/assistant/process
Process natural language requests using Gemini AI.

**Request Body:**
```json
{
  "input": "Schedule a meeting with John tomorrow at 2 PM",
  "context": {},
  "userId": "user123"
}
```

**Response:**
```json
{
  "intent": "schedule_meeting",
  "confidence": 0.8,
  "response": "I'll help you schedule a meeting with John tomorrow at 2 PM.",
  "actions": [
    {
      "type": "schedule_meeting",
      "parameters": {
        "title": "John",
        "time": "2 PM",
        "date": "tomorrow"
      },
      "priority": 1
    }
  ],
  "context": {
    "originalInput": "Schedule a meeting with John tomorrow at 2 PM"
  }
}
```

#### GET /api/assistant/briefing
Generate daily briefing.

**Query Parameters:**
- `date` (optional): Date for briefing (ISO string)
- `userId` (optional): User ID

**Response:**
```json
{
  "briefing": "Daily Briefing for Wed Aug 14 2025...",
  "date": "2025-08-14T08:49:31.661Z"
}
```

### 3. Calendar Management

#### GET /api/calendar/events
Get calendar events.

**Query Parameters:**
- `startDate` (optional): Start date (ISO string)
- `endDate` (optional): End date (ISO string)
- `maxResults` (optional): Maximum number of results (default: 10)

**Response:**
```json
[
  {
    "id": "mock-1",
    "summary": "Team Standup",
    "description": "Daily team synchronization meeting",
    "start": {
      "dateTime": "2025-08-14T09:49:32.664Z",
      "timeZone": "America/New_York"
    },
    "end": {
      "dateTime": "2025-08-14T10:19:32.664Z",
      "timeZone": "America/New_York"
    },
    "attendees": [
      {
        "email": "team@company.com",
        "displayName": "Development Team"
      }
    ]
  }
]
```

#### POST /api/calendar/schedule
Schedule a new meeting.

**Request Body:**
```json
{
  "title": "Project Review",
  "description": "Weekly project review meeting",
  "startTime": "2025-08-15T14:00:00Z",
  "endTime": "2025-08-15T15:00:00Z",
  "attendees": ["john@example.com", "jane@example.com"],
  "location": "Conference Room A",
  "isOnline": false
}
```

#### POST /api/calendar/intelligent-schedule
Use AI to find optimal meeting time.

**Request Body:**
```json
{
  "title": "Strategy Meeting",
  "description": "Quarterly strategy planning",
  "duration": 60,
  "attendees": ["exec@company.com", "team@company.com"],
  "urgency": "high",
  "isOnline": true
}
```

#### POST /api/calendar/availability
Check availability for attendees.

**Request Body:**
```json
{
  "startDate": "2025-08-15T09:00:00Z",
  "endDate": "2025-08-15T17:00:00Z",
  "attendees": ["user1@example.com", "user2@example.com"],
  "duration": 60
}
```

### 4. Task Management

#### GET /api/tasks
Get tasks with optional filters.

**Query Parameters:**
- `status`: Filter by status (todo, in_progress, completed, cancelled)
- `priority`: Filter by priority (low, medium, high, urgent)
- `assignedTo`: Filter by assigned user
- `tags`: Comma-separated list of tags

**Response:**
```json
[
  {
    "id": "task-123",
    "title": "Review Q4 Budget Proposal",
    "description": "Review and provide feedback on the Q4 budget proposal",
    "priority": "high",
    "status": "todo",
    "dueDate": "2025-08-16T08:47:49.364Z",
    "assignedTo": "executive@company.com",
    "createdBy": "assistant@company.com",
    "tags": ["finance", "budget", "review"],
    "createdAt": "2025-08-14T08:47:49.364Z",
    "updatedAt": "2025-08-14T08:47:49.364Z",
    "reminders": []
  }
]
```

#### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Prepare presentation",
  "description": "Create slides for board meeting",
  "priority": "high",
  "dueDate": "2025-08-20T17:00:00Z",
  "assignedTo": "user@example.com",
  "tags": ["presentation", "board"]
}
```

#### PUT /api/tasks/:id
Update an existing task.

**Request Body:**
```json
{
  "status": "completed",
  "priority": "medium"
}
```

#### GET /api/tasks/priority
Get priority tasks requiring immediate attention.

**Query Parameters:**
- `limit` (optional): Maximum number of tasks (default: 10)

#### GET /api/tasks/analytics
Get task analytics for a time period.

**Query Parameters:**
- `startDate` (optional): Start date for analytics
- `endDate` (optional): End date for analytics

### 5. Email Automation

#### GET /api/email/templates
Get all email templates.

**Query Parameters:**
- `category` (optional): Filter by category

**Response:**
```json
[
  {
    "id": "template-123",
    "name": "Meeting Confirmation",
    "subject": "Meeting Confirmation: {{title}}",
    "htmlContent": "<h2>Meeting Confirmation</h2>...",
    "textContent": "Meeting Confirmation: {{title}}...",
    "variables": ["title", "startTime", "attendeeName"],
    "category": "meeting_confirmation",
    "createdAt": "2025-08-14T08:47:49.359Z",
    "updatedAt": "2025-08-14T08:47:49.359Z"
  }
]
```

#### POST /api/email/send
Send an email.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "cc": ["cc@example.com"],
  "subject": "Important Update",
  "content": "<p>This is an important update...</p>"
}
```

#### POST /api/email/send-template
Send an email using a template.

**Request Body:**
```json
{
  "to": "attendee@example.com",
  "templateId": "template-123",
  "variables": {
    "title": "Project Review",
    "startTime": "Tomorrow at 2 PM",
    "attendeeName": "John"
  }
}
```

#### POST /api/email/templates
Create a new email template.

**Request Body:**
```json
{
  "name": "Custom Template",
  "subject": "Custom Subject: {{variable}}",
  "htmlContent": "<p>Custom HTML content with {{variable}}</p>",
  "textContent": "Custom text content with {{variable}}",
  "category": "general",
  "variables": ["variable"]
}
```

### 6. Automation

#### GET /api/automation/briefing
Get daily briefing with meetings, tasks, and suggestions.

**Response:**
```json
{
  "date": "2025-08-14T08:49:31.661Z",
  "upcomingMeetings": [...],
  "priorityTasks": [...],
  "importantEmails": [],
  "suggestions": [
    "Consider blocking time for deep work between meetings",
    "Review and respond to priority emails"
  ]
}
```

#### POST /api/automation/trigger
Trigger a proactive automation action.

**Request Body:**
```json
{
  "actionType": "daily_briefing",
  "context": {}
}
```

**Available Action Types:**
- `daily_briefing`: Generate and send daily briefing
- `task_reminder`: Check and send task reminders
- `calendar_optimization`: Analyze and optimize calendar
- `follow_up_check`: Check for needed follow-ups

#### GET /api/automation/status
Get status of all automation jobs.

**Response:**
```json
{
  "dailyBriefing": {
    "enabled": true,
    "nextRun": "2025-08-15T08:00:00Z"
  },
  "taskReminders": {
    "enabled": true,
    "nextRun": "2025-08-14T12:00:00Z"
  },
  "calendarOptimization": {
    "enabled": true,
    "nextRun": "2025-08-18T18:00:00Z"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  }
}
```

## Rate Limits

- **General API**: 1000 requests per hour per IP
- **AI Processing**: 15 requests per minute (Gemini limit)
- **Email Sending**: 50 emails per hour

## Webhooks

The system supports webhooks for real-time notifications:

### Calendar Events
- `calendar.event.created`
- `calendar.event.updated`
- `calendar.event.deleted`

### Task Updates
- `task.created`
- `task.updated`
- `task.completed`
- `task.overdue`

### Email Events
- `email.sent`
- `email.delivered`
- `email.opened`
- `email.clicked`

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://your-app-url.run.app',
  headers: {
    'X-API-Key': 'your_api_key'
  }
});

// Process AI request
const response = await client.post('/api/assistant/process', {
  input: 'Schedule a meeting tomorrow'
});

// Create task
const task = await client.post('/api/tasks', {
  title: 'Review proposal',
  priority: 'high',
  dueDate: '2025-08-20T17:00:00Z'
});
```

### Python
```python
import requests

headers = {'X-API-Key': 'your_api_key'}
base_url = 'https://your-app-url.run.app'

# Get tasks
response = requests.get(f'{base_url}/api/tasks', headers=headers)
tasks = response.json()

# Send email
email_data = {
    'to': 'user@example.com',
    'subject': 'Test Email',
    'content': 'This is a test email'
}
response = requests.post(f'{base_url}/api/email/send', 
                        json=email_data, headers=headers)
```

This API provides comprehensive functionality for executive assistant automation with AI-powered intelligence, calendar management, email automation, task coordination, and proactive workflow optimization.
