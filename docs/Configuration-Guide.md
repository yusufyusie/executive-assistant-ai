# Executive Assistant AI - Configuration Guide

## 🔧 Comprehensive Configuration Management

The Executive Assistant AI system is **fully configurable** through environment variables, supporting multiple deployment environments and runtime customization.

## 📋 Configuration Categories

### 1. **Application Settings**
```bash
# Core application configuration
NODE_ENV=development|staging|production|test
PORT=3000
APP_NAME=Executive Assistant AI
APP_VERSION=2.0.0
TIMEZONE=UTC
```

### 2. **AI Services Configuration**
```bash
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
GEMINI_REQUESTS_PER_MINUTE=15
```

### 3. **Google Services Configuration**
```bash
# Google Calendar & OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here
GCP_PROJECT_ID=your_gcp_project_id
GCP_REGION=us-central1
GCP_SCHEDULER_TIMEZONE=America/New_York
```

### 4. **Email Services Configuration**
```bash
# SendGrid Email Automation
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=your_verified_sender_email@domain.com
SENDGRID_FROM_NAME=Executive Assistant AI
EMAIL_DAILY_LIMIT=100
ENABLE_EMAIL_TEMPLATES=true
```

### 5. **Security Configuration**
```bash
# Authentication & Security
JWT_SECRET=your_jwt_secret_here
API_KEY=your_api_key_here
JWT_EXPIRATION_TIME=3600
ENABLE_CORS=true
ENABLE_RATE_LIMIT=true
```

### 6. **Performance Configuration**
```bash
# Rate Limiting & Caching
RATE_LIMIT_MAX=100
RATE_LIMIT_TTL=60000
CACHE_DEFAULT_TTL=300
ENABLE_CACHING=true
ENABLE_COMPRESSION=true
```

### 7. **Feature Flags**
```bash
# Enable/Disable Features
FEATURE_AI_ASSISTANT=true
FEATURE_CALENDAR_INTEGRATION=true
FEATURE_EMAIL_AUTOMATION=true
FEATURE_TASK_MANAGEMENT=true
FEATURE_PROACTIVE_AUTOMATION=true
FEATURE_ANALYTICS=true
FEATURE_ADVANCED_LOGGING=true
```

### 8. **Logging Configuration**
```bash
# Logging Settings
LOG_LEVEL=error|warn|info|debug|verbose
LOG_FORMAT=json|simple
ENABLE_ADVANCED_LOGGING=true
```

### 9. **Application Behavior**
```bash
# Business Logic Configuration
MAX_CALENDAR_DAYS_AHEAD=90
EMAIL_RATE_LIMIT_PER_HOUR=50
TASK_REMINDER_ADVANCE_HOURS=24
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true
```

## 🚀 Environment-Specific Configurations

### Development Environment
```bash
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_DEBUG_LOGS=true
```

### Production Environment
```bash
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_SWAGGER=false
ENABLE_DEBUG_LOGS=false
JWT_SECRET=strong_production_secret
```

## 🔒 Security Best Practices

### Required in Production
- `GEMINI_API_KEY` - Must be set
- `SENDGRID_API_KEY` - Must be set
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Must be set
- `JWT_SECRET` - Must be strong and unique

### Security Recommendations
- Use strong, unique secrets for production
- Enable CORS only for trusted domains
- Set appropriate rate limits
- Use HTTPS in production

## 📊 Configuration Validation

The system includes comprehensive validation:
- **Type Safety**: All configs are type-checked
- **Range Validation**: Numeric values have min/max limits
- **Format Validation**: Email addresses, URLs validated
- **Required Checks**: Production environment validation
- **Runtime Validation**: Startup configuration verification

## 🎛️ Dynamic Configuration

### Feature Flags
Toggle features without code changes:
```typescript
// Disable AI assistant temporarily
FEATURE_AI_ASSISTANT=false

// Enable only core features
FEATURE_CALENDAR_INTEGRATION=true
FEATURE_EMAIL_AUTOMATION=false
```

### Performance Tuning
Adjust performance settings:
```typescript
// High-traffic configuration
RATE_LIMIT_MAX=1000
CACHE_DEFAULT_TTL=600
ENABLE_COMPRESSION=true
```

## 🔧 Configuration Loading

The system supports multiple configuration sources:
1. **Environment Variables** (highest priority)
2. **`.env` files** (development)
3. **Default Values** (fallback)

## 📝 Configuration Examples

### Minimal Development Setup
```bash
NODE_ENV=development
GEMINI_API_KEY=your_key_here
```

### Full Production Setup
```bash
NODE_ENV=production
PORT=8080
GEMINI_API_KEY=prod_gemini_key
GOOGLE_CLIENT_ID=prod_google_client_id
SENDGRID_API_KEY=prod_sendgrid_key
JWT_SECRET=strong_production_secret
ENABLE_RATE_LIMIT=true
RATE_LIMIT_MAX=500
```

## 🎯 Configuration Management Benefits

- **✅ Zero Hardcoded Values**: Everything configurable
- **✅ Environment Flexibility**: Easy deployment across environments
- **✅ Feature Control**: Toggle features without code changes
- **✅ Performance Tuning**: Adjust performance parameters
- **✅ Security Control**: Manage security settings
- **✅ Validation**: Comprehensive configuration validation
- **✅ Type Safety**: Full TypeScript support
- **✅ Documentation**: Complete configuration reference

This configuration system ensures the Executive Assistant AI can be deployed and customized for any environment or use case.
