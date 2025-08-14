import { registerAs } from '@nestjs/config';

// Helper functions for safe parsing
const safeParseInt = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const safeParseFloat = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Export all configurations
export default () => ({
  app: {
    name: process.env.APP_NAME || 'Executive Assistant AI',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: safeParseInt(process.env.PORT, 3000),
    host: process.env.HOST || '0.0.0.0',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    timezone: process.env.DEFAULT_TIMEZONE || 'America/New_York'
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      temperature: safeParseFloat(process.env.GEMINI_TEMPERATURE, 0.7),
      maxTokens: safeParseInt(process.env.GEMINI_MAX_TOKENS, 2048)
    }
  },
  calendar: {
    provider: process.env.CALENDAR_PROVIDER || 'google',
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN
    }
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'assistant@company.com',
      fromName: process.env.SENDGRID_FROM_NAME || 'Executive Assistant AI'
    }
  },
  tasks: {
    defaultPriority: process.env.TASK_DEFAULT_PRIORITY || 'medium',
    reminderAdvanceHours: safeParseInt(process.env.TASK_REMINDER_ADVANCE_HOURS, 24)
  },
  automation: {
    enabled: process.env.AUTOMATION_ENABLED !== 'false',
    timezone: process.env.AUTOMATION_TIMEZONE || 'America/New_York'
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.GCP_REGION || 'us-central1',
    schedulerTimezone: process.env.GCP_SCHEDULER_TIMEZONE || 'America/New_York'
  }
});


