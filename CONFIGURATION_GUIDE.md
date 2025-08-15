# Executive Assistant AI - Configuration Guide

## 🔧 **FULLY-CONFIGURABLE SYSTEM**

The Executive Assistant AI is designed as a **fully-configurable, enterprise-grade system** that can be customized for any organization's needs.

## 📋 **Configuration Categories**

### **1. Application Configuration**

```typescript
interface ApplicationConfig {
  name: string;           // Application name
  port: number;          // Server port
  environment: string;   // Environment (dev/staging/prod)
  version: string;       // Application version
  timezone: string;      // Default timezone
  locale: string;        // Default locale
}
```

**Environment Variables:**
```bash
APP_NAME="Executive Assistant AI"
PORT=3000
NODE_ENV=production
APP_VERSION=2.0.0
DEFAULT_TIMEZONE=America/New_York
DEFAULT_LOCALE=en-US
```

### **2. AI Configuration (Google Gemini)**

```typescript
interface GeminiConfig {
  apiKey: string;           // Gemini API key
  model: string;            // Model version
  maxTokens: number;        // Max tokens per request
  temperature: number;      // Response creativity (0-1)
  requestsPerMinute: number; // Rate limiting
  enableStreaming: boolean; // Stream responses
  safetySettings: object;   // Content safety filters
}
```

**Environment Variables:**
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
GEMINI_REQUESTS_PER_MINUTE=15
GEMINI_ENABLE_STREAMING=true
```

### **3. Google Services Configuration**

```typescript
interface GoogleConfig {
  clientId: string;         // OAuth client ID
  clientSecret: string;     // OAuth client secret
  redirectUri: string;      // OAuth redirect URI
  refreshToken: string;     // Long-lived refresh token
  projectId: string;        // GCP project ID
  region: string;           // GCP region
  calendarId: string;       // Default calendar ID
  scopes: string[];         // Required OAuth scopes
}
```

**Environment Variables:**
```bash
GOOGLE_CLIENT_ID=your_client_id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token
GCP_PROJECT_ID=your-gcp-project
GCP_REGION=us-central1
GOOGLE_CALENDAR_ID=primary
```

### **4. Email Configuration (SendGrid)**

```typescript
interface SendGridConfig {
  apiKey: string;           // SendGrid API key
  fromEmail: string;        // Default sender email
  fromName: string;         // Default sender name
  dailyLimit: number;       // Daily email limit
  enableTemplates: boolean; // Use email templates
  webhookUrl: string;       // Webhook for delivery events
  enableTracking: boolean;  // Track opens/clicks
}
```

**Environment Variables:**
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=assistant@yourcompany.com
SENDGRID_FROM_NAME="Executive Assistant AI"
EMAIL_DAILY_LIMIT=100
ENABLE_EMAIL_TEMPLATES=true
SENDGRID_WEBHOOK_URL=https://yourapp.com/webhooks/sendgrid
ENABLE_EMAIL_TRACKING=true
```

### **5. Security Configuration**

```typescript
interface SecurityConfig {
  jwtSecret: string;        // JWT signing secret
  apiKey: string;           // API authentication key
  jwtExpirationTime: number; // JWT expiry (seconds)
  enableCors: boolean;      // Enable CORS
  enableRateLimit: boolean; // Enable rate limiting
  corsOrigins: string[];    // Allowed CORS origins
  encryptionKey: string;    // Data encryption key
  sessionSecret: string;    // Session secret
}
```

**Environment Variables:**
```bash
JWT_SECRET=your_super_secure_jwt_secret_here
API_KEY=your_api_key_here
JWT_EXPIRATION_TIME=3600
ENABLE_CORS=true
ENABLE_RATE_LIMIT=true
CORS_ORIGINS=https://yourapp.com,https://admin.yourapp.com
ENCRYPTION_KEY=your_32_character_encryption_key
SESSION_SECRET=your_session_secret_here
```

### **6. Performance Configuration**

```typescript
interface PerformanceConfig {
  rateLimitMax: number;     // Max requests per window
  rateLimitTtl: number;     // Rate limit window (ms)
  cacheDefaultTtl: number;  // Default cache TTL (seconds)
  enableCaching: boolean;   // Enable response caching
  enableCompression: boolean; // Enable gzip compression
  maxRequestSize: string;   // Max request body size
  timeoutMs: number;        // Request timeout
}
```

**Environment Variables:**
```bash
RATE_LIMIT_MAX=100
RATE_LIMIT_TTL=60000
CACHE_DEFAULT_TTL=300
ENABLE_CACHING=true
ENABLE_COMPRESSION=true
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT_MS=30000
```

### **7. Feature Flags**

```typescript
interface FeatureConfig {
  enableAIAssistant: boolean;        // AI assistant features
  enableCalendarIntegration: boolean; // Calendar features
  enableEmailAutomation: boolean;    // Email automation
  enableTaskManagement: boolean;     // Task management
  enableProactiveAutomation: boolean; // Proactive features
  enableAnalytics: boolean;          // Analytics and reporting
  enableAdvancedLogging: boolean;    // Detailed logging
  enableWebhooks: boolean;           // Webhook support
  enableNotifications: boolean;      // Push notifications
}
```

**Environment Variables:**
```bash
FEATURE_AI_ASSISTANT=true
FEATURE_CALENDAR_INTEGRATION=true
FEATURE_EMAIL_AUTOMATION=true
FEATURE_TASK_MANAGEMENT=true
FEATURE_PROACTIVE_AUTOMATION=true
FEATURE_ANALYTICS=true
FEATURE_ADVANCED_LOGGING=true
FEATURE_WEBHOOKS=true
FEATURE_NOTIFICATIONS=true
```

### **8. Database Configuration**

```typescript
interface DatabaseConfig {
  host: string;             // Database host
  port: number;             // Database port
  username: string;         // Database username
  password: string;         // Database password
  database: string;         // Database name
  ssl: boolean;             // Enable SSL
  poolSize: number;         // Connection pool size
  timeout: number;          // Query timeout
}
```

**Environment Variables:**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_DATABASE=executive_assistant
DB_SSL=true
DB_POOL_SIZE=10
DB_TIMEOUT=30000
```

## 🚀 **Configuration Loading**

### **Environment-Specific Configuration**

```typescript
// config/environments/development.ts
export default {
  app: {
    port: 3000,
    environment: 'development',
  },
  security: {
    enableRateLimit: false,
    corsOrigins: ['http://localhost:3000'],
  },
  performance: {
    enableCaching: false,
  },
};

// config/environments/production.ts
export default {
  app: {
    port: process.env.PORT || 8080,
    environment: 'production',
  },
  security: {
    enableRateLimit: true,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
  },
  performance: {
    enableCaching: true,
  },
};
```

### **Configuration Validation**

```typescript
export const validateConfig = (config: AppConfig): string[] => {
  const errors: string[] = [];

  // Validate required fields
  if (!config.gemini.apiKey && config.features.enableAIAssistant) {
    errors.push('GEMINI_API_KEY is required when AI assistant is enabled');
  }

  if (!config.sendgrid.apiKey && config.features.enableEmailAutomation) {
    errors.push('SENDGRID_API_KEY is required when email automation is enabled');
  }

  // Validate security settings
  if (config.app.environment === 'production') {
    if (config.security.jwtSecret === 'dev-jwt-secret-change-in-production') {
      errors.push('JWT_SECRET must be changed in production');
    }
  }

  return errors;
};
```

## 📝 **Configuration Examples**

### **Development Environment (.env.development)**

```bash
# Application
APP_NAME="Executive Assistant AI (Dev)"
PORT=3000
NODE_ENV=development

# AI Services
GEMINI_API_KEY=your_dev_gemini_key
GEMINI_TEMPERATURE=0.9

# Security (relaxed for development)
ENABLE_RATE_LIMIT=false
ENABLE_CORS=true
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Features (all enabled for testing)
FEATURE_AI_ASSISTANT=true
FEATURE_CALENDAR_INTEGRATION=true
FEATURE_EMAIL_AUTOMATION=true
```

### **Production Environment (.env.production)**

```bash
# Application
APP_NAME="Executive Assistant AI"
PORT=8080
NODE_ENV=production

# AI Services
GEMINI_API_KEY=your_production_gemini_key
GEMINI_TEMPERATURE=0.7

# Security (strict for production)
JWT_SECRET=your_super_secure_production_jwt_secret
API_KEY=your_production_api_key
ENABLE_RATE_LIMIT=true
RATE_LIMIT_MAX=50

# Performance
ENABLE_CACHING=true
ENABLE_COMPRESSION=true
```

## 🔧 **Runtime Configuration**

### **Dynamic Configuration Updates**

```typescript
@Injectable()
export class ConfigurationService {
  async updateFeatureFlag(feature: string, enabled: boolean): Promise<void> {
    // Update feature flag in real-time
    await this.configRepository.updateFeature(feature, enabled);
    this.eventBus.publish(new FeatureFlagUpdatedEvent(feature, enabled));
  }

  async reloadConfiguration(): Promise<void> {
    // Reload configuration without restart
    const newConfig = await this.loadConfiguration();
    this.validateConfiguration(newConfig);
    this.applyConfiguration(newConfig);
  }
}
```

This **fully-configurable system** allows organizations to:

- ✅ **Customize all aspects** of the AI assistant behavior
- ✅ **Enable/disable features** based on needs and licensing
- ✅ **Scale performance** settings based on usage
- ✅ **Secure the system** with enterprise-grade security
- ✅ **Adapt to different environments** (dev/staging/prod)
- ✅ **Integrate with existing systems** through flexible APIs
- ✅ **Monitor and optimize** through comprehensive configuration
