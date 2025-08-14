export default () => ({
  app: {
    name: process.env.APP_NAME || 'Executive Assistant AI',
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    fromName: process.env.SENDGRID_FROM_NAME || 'Executive Assistant AI',
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.GCP_REGION || 'us-central1',
    schedulerTimezone: process.env.GCP_SCHEDULER_TIMEZONE || 'America/New_York',
  },
  application: {
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'America/New_York',
    maxCalendarDaysAhead: parseInt(process.env.MAX_CALENDAR_DAYS_AHEAD || '90', 10),
    emailRateLimitPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '50', 10),
    taskReminderAdvanceHours: parseInt(process.env.TASK_REMINDER_ADVANCE_HOURS || '24', 10),
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    apiKey: process.env.API_KEY,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
});
