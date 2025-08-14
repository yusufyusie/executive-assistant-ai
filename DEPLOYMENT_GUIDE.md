# Executive Assistant AI - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Executive Assistant AI to Google Cloud Platform (GCP) using the Always Free Tier resources.

## Prerequisites

1. **Google Cloud Account**: Create a free GCP account at [cloud.google.com](https://cloud.google.com)
2. **Google AI Studio Account**: Sign up at [ai.google.dev](https://ai.google.dev) for Gemini API access
3. **SendGrid Account**: Create a free account at [sendgrid.com](https://sendgrid.com)
4. **Git**: Ensure Git is installed on your local machine

## Step 1: API Keys Setup

### 1.1 Gemini AI API Key
1. Visit [Google AI Studio](https://ai.google.dev)
2. Sign in with your Google account
3. Click "Get API Key" → "Create API key in new project"
4. Copy the generated API key

### 1.2 SendGrid API Key
1. Sign up for a free SendGrid account
2. Navigate to Settings → API Keys
3. Create a new API key with "Full Access" permissions
4. Copy the API key
5. Verify a sender email address in SendGrid

### 1.3 Google Calendar API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials JSON file

## Step 2: Environment Configuration

Create a `.env` file in your project root:

```bash
# Application Settings
NODE_ENV=production
PORT=8080
APP_NAME=Executive Assistant AI

# Google Gemini AI Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app-url.run.app/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token

# SendGrid Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_email@domain.com
SENDGRID_FROM_NAME=Executive Assistant AI

# GCP Configuration
GCP_PROJECT_ID=your-gcp-project-id
GCP_REGION=us-central1
GCP_SCHEDULER_TIMEZONE=America/New_York

# Application Configuration
DEFAULT_TIMEZONE=America/New_York
MAX_CALENDAR_DAYS_AHEAD=90
EMAIL_RATE_LIMIT_PER_HOUR=50
TASK_REMINDER_ADVANCE_HOURS=24

# Security Configuration
JWT_SECRET=your_secure_jwt_secret_here
API_KEY=your_secure_api_key_here
```

## Step 3: GCP Project Setup

### 3.1 Install Google Cloud CLI
```bash
# Download and install from: https://cloud.google.com/sdk/docs/install
gcloud init
gcloud auth login
```

### 3.2 Set Project Configuration
```bash
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region us-central1
```

### 3.3 Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable calendar-json.googleapis.com
```

## Step 4: Deployment to Cloud Run

### 4.1 Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
```

### 4.2 Create .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.env.example
```

### 4.3 Deploy to Cloud Run
```bash
# Build and deploy
gcloud run deploy executive-assistant-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,PORT=8080
```

### 4.4 Set Environment Variables
```bash
# Set all environment variables
gcloud run services update executive-assistant-ai \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=your_key,SENDGRID_API_KEY=your_key
```

## Step 5: Cloud Scheduler Setup

### 5.1 Create Daily Briefing Job
```bash
gcloud scheduler jobs create http daily-briefing \
  --schedule="0 8 * * *" \
  --uri="https://your-app-url.run.app/api/automation/trigger" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{"actionType":"daily_briefing"}' \
  --time-zone="America/New_York"
```

### 5.2 Create Task Reminder Job
```bash
gcloud scheduler jobs create http task-reminders \
  --schedule="0 */4 * * *" \
  --uri="https://your-app-url.run.app/api/automation/trigger" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{"actionType":"task_reminder"}' \
  --time-zone="America/New_York"
```

### 5.3 Create Weekly Calendar Optimization
```bash
gcloud scheduler jobs create http calendar-optimization \
  --schedule="0 18 * * 0" \
  --uri="https://your-app-url.run.app/api/automation/trigger" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{"actionType":"calendar_optimization"}' \
  --time-zone="America/New_York"
```

## Step 6: Verification & Testing

### 6.1 Health Check
```bash
curl https://your-app-url.run.app/health
```

### 6.2 Test API Endpoints
```bash
# Test AI Assistant
curl -X POST https://your-app-url.run.app/api/assistant/process \
  -H "Content-Type: application/json" \
  -d '{"input": "Schedule a meeting tomorrow"}'

# Test Tasks
curl https://your-app-url.run.app/api/tasks

# Test Email Templates
curl https://your-app-url.run.app/api/email/templates

# Test Daily Briefing
curl https://your-app-url.run.app/api/automation/briefing
```

## Step 7: Monitoring & Maintenance

### 7.1 View Logs
```bash
gcloud run services logs read executive-assistant-ai --region us-central1
```

### 7.2 Monitor Resource Usage
- Visit GCP Console → Cloud Run → executive-assistant-ai
- Monitor CPU, Memory, and Request metrics
- Ensure staying within Always Free Tier limits

### 7.3 Update Deployment
```bash
# For code updates
gcloud run deploy executive-assistant-ai \
  --source . \
  --region us-central1
```

## Always Free Tier Limits

### Cloud Run
- 180,000 vCPU-seconds per month
- 360,000 GiB-seconds per month
- 2 million requests per month

### Cloud Scheduler
- 3 jobs per month (we use 3)

### Cloud Build
- 120 build-minutes per day

### Gemini AI
- 15 requests per minute
- 1,500 requests per day

### SendGrid
- 100 emails per day

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Dockerfile syntax
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Environment Variables**
   - Use `gcloud run services describe` to verify env vars
   - Check for typos in variable names
   - Ensure sensitive values are properly escaped

3. **API Limits**
   - Monitor usage in respective dashboards
   - Implement rate limiting in application
   - Consider upgrading if needed

4. **Scheduler Jobs Not Running**
   - Check job status: `gcloud scheduler jobs list`
   - Verify timezone settings
   - Check application logs for errors

## Security Best Practices

1. **API Keys**: Never commit API keys to version control
2. **IAM**: Use least privilege principle for service accounts
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement application-level rate limiting
5. **Monitoring**: Set up alerts for unusual activity

## Cost Optimization

1. **Resource Limits**: Set appropriate CPU and memory limits
2. **Scaling**: Configure min/max instances based on usage
3. **Monitoring**: Regular review of usage metrics
4. **Cleanup**: Remove unused resources and old deployments

## Support & Documentation

- **GCP Documentation**: [cloud.google.com/docs](https://cloud.google.com/docs)
- **Cloud Run Guide**: [cloud.google.com/run/docs](https://cloud.google.com/run/docs)
- **Gemini AI Docs**: [ai.google.dev/docs](https://ai.google.dev/docs)
- **SendGrid Docs**: [docs.sendgrid.com](https://docs.sendgrid.com)

This deployment guide ensures your Executive Assistant AI runs efficiently within GCP's Always Free Tier while providing enterprise-grade functionality.
