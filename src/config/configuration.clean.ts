/**
 * Executive Assistant AI - Clean Configuration
 * Working configuration without type conflicts
 */

export interface AppConfig {
  app: {
    name: string;
    port: number;
    environment: string;
    version: string;
  };
  gemini: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    requestsPerMinute: number;
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
    projectId: string;
    region: string;
  };
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    dailyLimit: number;
    enableTemplates: boolean;
  };
  security: {
    jwtSecret: string;
    apiKey: string;
    jwtExpirationTime: number;
    enableCors: boolean;
    enableRateLimit: boolean;
  };
  performance: {
    rateLimitMax: number;
    rateLimitTtl: number;
    cacheDefaultTtl: number;
    enableCaching: boolean;
    enableCompression: boolean;
  };
  features: {
    enableAIAssistant: boolean;
    enableCalendarIntegration: boolean;
    enableEmailAutomation: boolean;
    enableTaskManagement: boolean;
    enableProactiveAutomation: boolean;
    enableAnalytics: boolean;
    enableAdvancedLogging: boolean;
  };
}

export default (): AppConfig => ({
  app: {
    name: process.env.APP_NAME || 'Executive Assistant AI',
    port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '2.0.0',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS ?? '1000', 10) || 1000,
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE ?? '0.7') || 0.7,
    requestsPerMinute: parseInt(process.env.GEMINI_REQUESTS_PER_MINUTE ?? '15', 10) || 15,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    projectId: process.env.GCP_PROJECT_ID || '',
    region: process.env.GCP_REGION || 'us-central1',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'assistant@company.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Executive Assistant AI',
    dailyLimit: parseInt(process.env.EMAIL_DAILY_LIMIT ?? '100', 10) || 100,
    enableTemplates: process.env.ENABLE_EMAIL_TEMPLATES === 'true',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    apiKey: process.env.API_KEY || 'dev-api-key-change-in-production',
    jwtExpirationTime: parseInt(process.env.JWT_EXPIRATION_TIME ?? '3600', 10) || 3600,
    enableCors: process.env.ENABLE_CORS !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
  },
  performance: {
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10) || 100,
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10) || 60000,
    cacheDefaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL ?? '300', 10) || 300,
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
  },
  features: {
    enableAIAssistant: process.env.FEATURE_AI_ASSISTANT !== 'false',
    enableCalendarIntegration: process.env.FEATURE_CALENDAR_INTEGRATION !== 'false',
    enableEmailAutomation: process.env.FEATURE_EMAIL_AUTOMATION !== 'false',
    enableTaskManagement: process.env.FEATURE_TASK_MANAGEMENT !== 'false',
    enableProactiveAutomation: process.env.FEATURE_PROACTIVE_AUTOMATION !== 'false',
    enableAnalytics: process.env.FEATURE_ANALYTICS !== 'false',
    enableAdvancedLogging: process.env.FEATURE_ADVANCED_LOGGING !== 'false',
  },
});

// Configuration validation helper
export const validateConfig = (config: AppConfig): string[] => {
  const errors: string[] = [];

  // Validate required API keys in production
  if (config.app.environment === 'production') {
    if (!config.gemini.apiKey) {
      errors.push('GEMINI_API_KEY is required in production');
    }
    if (!config.sendgrid.apiKey) {
      errors.push('SENDGRID_API_KEY is required in production');
    }
    if (!config.google.clientId || !config.google.clientSecret) {
      errors.push('Google OAuth credentials are required in production');
    }
    if (config.security.jwtSecret === 'dev-jwt-secret-change-in-production') {
      errors.push('JWT_SECRET must be changed in production');
    }
    if (config.security.apiKey === 'dev-api-key-change-in-production') {
      errors.push('API_KEY must be changed in production');
    }
  }

  // Validate port range
  if (config.app.port < 1 || config.app.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (config.sendgrid.fromEmail && !emailRegex.test(config.sendgrid.fromEmail)) {
    errors.push('SENDGRID_FROM_EMAIL must be a valid email address');
  }

  return errors;
};

// Configuration health check
export const getConfigurationHealth = (config: AppConfig): {
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for missing API keys
  if (!config.gemini.apiKey) {
    issues.push('Gemini API key not configured - AI features will use mock responses');
    recommendations.push('Add GEMINI_API_KEY to enable AI functionality');
  }

  if (!config.sendgrid.apiKey) {
    issues.push('SendGrid API key not configured - email features will use mock responses');
    recommendations.push('Add SENDGRID_API_KEY to enable email functionality');
  }

  if (!config.google.clientId) {
    issues.push('Google OAuth not configured - calendar features will use mock responses');
    recommendations.push('Add Google OAuth credentials to enable calendar functionality');
  }

  // Performance recommendations
  if (config.performance.rateLimitMax > 200) {
    recommendations.push('Consider lowering rate limit for better resource management');
  }

  if (!config.performance.enableCaching) {
    recommendations.push('Enable caching for better performance');
  }

  // Security recommendations
  if (config.app.environment === 'production') {
    if (!config.security.enableRateLimit) {
      issues.push('Rate limiting disabled in production');
      recommendations.push('Enable rate limiting for production security');
    }
  }

  const status = issues.length > 0 ? 'warning' : 'healthy';

  return { status, issues, recommendations };
};
