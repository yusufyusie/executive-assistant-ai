/**
 * Application Constants
 * Centralized constants for the Executive Assistant AI application
 */

// Application Information
export const APPLICATION_INFO = {
  NAME: 'Executive Assistant AI',
  VERSION: '1.0.0',
  DESCRIPTION: 'Intelligent automation platform for executive productivity',
  AUTHOR: 'Executive AI Team',
  LICENSE: 'MIT'
} as const;

// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  PREFIX: 'api',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_REQUEST_SIZE: '10mb'
} as const;

// HTTP Headers
export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  API_KEY: 'X-API-Key',
  REQUEST_ID: 'X-Request-ID',
  CORRELATION_ID: 'X-Correlation-ID',
  USER_AGENT: 'User-Agent',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  CACHE_CONTROL: 'Cache-Control'
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  TEXT: 'text/plain',
  HTML: 'text/html',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded'
} as const;

// Cache Keys
export const CACHE_KEYS = {
  AI_RESPONSE: 'ai:response',
  CALENDAR_EVENTS: 'calendar:events',
  EMAIL_TEMPLATES: 'email:templates',
  TASK_PRIORITIES: 'tasks:priorities',
  USER_PREFERENCES: 'user:preferences',
  SYSTEM_CONFIG: 'system:config'
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT: {
    WINDOW_MS: 900000, // 15 minutes
    MAX_REQUESTS: 100
  },
  AI_PROCESSING: {
    WINDOW_MS: 60000,  // 1 minute
    MAX_REQUESTS: 15
  },
  EMAIL_SENDING: {
    WINDOW_MS: 3600000, // 1 hour
    MAX_REQUESTS: 100
  },
  CALENDAR_SYNC: {
    WINDOW_MS: 60000,   // 1 minute
    MAX_REQUESTS: 30
  }
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true
  },
  EMAIL: {
    MAX_LENGTH: 254,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  TEXT_INPUT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 1000
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000
  },
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  }
} as const;

// Date and Time
export const DATE_TIME = {
  DEFAULT_TIMEZONE: 'America/New_York',
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm:ss',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  ISO_FORMAT: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  WORKING_HOURS: {
    START: '09:00',
    END: '17:00',
    DAYS: [1, 2, 3, 4, 5] // Monday to Friday
  }
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 25 * 1024 * 1024, // 25MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  UPLOAD_PATH: './uploads'
} as const;

// Error Codes
export const ERROR_CODES = {
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Authentication Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Authorization Errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Resource Errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // External Service Errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  CALENDAR_SERVICE_ERROR: 'CALENDAR_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  
  // System Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION: 'INVALID_OPERATION',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  PROCESSED: 'Request processed successfully',
  SENT: 'Message sent successfully',
  SCHEDULED: 'Event scheduled successfully'
} as const;

// AI Configuration
export const AI_CONFIG = {
  DEFAULT_MODEL: 'gemini-2.0-flash-exp',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2048,
  MAX_CONTEXT_LENGTH: 4096,
  CONFIDENCE_THRESHOLD: 0.7,
  PROCESSING_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

// Calendar Configuration
export const CALENDAR_CONFIG = {
  DEFAULT_DURATION: 60, // minutes
  BUFFER_TIME: 15,      // minutes
  MAX_LOOKAHEAD_DAYS: 90,
  REMINDER_TIMES: [15, 60], // minutes before event
  MAX_ATTENDEES: 50,
  SYNC_INTERVAL: 300000 // 5 minutes
} as const;

// Email Configuration
export const EMAIL_CONFIG = {
  MAX_RECIPIENTS: 100,
  MAX_SUBJECT_LENGTH: 200,
  MAX_BODY_LENGTH: 50000,
  DEFAULT_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds
  TRACKING_PIXEL_SIZE: '1x1'
} as const;

// Task Configuration
export const TASK_CONFIG = {
  MAX_SUBTASKS: 20,
  MAX_TAGS: 10,
  MAX_DEPENDENCIES: 10,
  DEFAULT_REMINDER_ADVANCE: 24, // hours
  OVERDUE_CHECK_INTERVAL: 3600000, // 1 hour
  PRIORITY_WEIGHTS: {
    URGENCY: 0.4,
    IMPORTANCE: 0.3,
    EFFORT: 0.2,
    DEADLINE: 0.1
  }
} as const;

// Automation Configuration
export const AUTOMATION_CONFIG = {
  MAX_CONCURRENT_JOBS: 5,
  JOB_TIMEOUT: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  BRIEFING_SCHEDULE: '0 8 * * *', // 8 AM daily
  REMINDER_SCHEDULE: '0 */4 * * *' // Every 4 hours
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  JWT_EXPIRATION: '24h',
  BCRYPT_ROUNDS: 12,
  SESSION_TIMEOUT: 3600000, // 1 hour
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15 minutes
  PASSWORD_RESET_EXPIRATION: 3600000 // 1 hour
} as const;

// Monitoring Configuration
export const MONITORING_CONFIG = {
  HEALTH_CHECK_TIMEOUT: 5000, // 5 seconds
  METRICS_COLLECTION_INTERVAL: 60000, // 1 minute
  LOG_RETENTION_DAYS: 30,
  ALERT_THRESHOLDS: {
    ERROR_RATE: 0.05, // 5%
    RESPONSE_TIME: 2000, // 2 seconds
    CPU_USAGE: 0.8, // 80%
    MEMORY_USAGE: 0.8 // 80%
  }
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  CONNECTION_TIMEOUT: 60000, // 1 minute
  QUERY_TIMEOUT: 30000, // 30 seconds
  MAX_CONNECTIONS: 10,
  IDLE_TIMEOUT: 300000, // 5 minutes
  MIGRATION_TABLE: 'migrations',
  SEED_TABLE: 'seeds'
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/.+/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
} as const;

// Environment Variables
export const ENV_VARS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DATABASE_URL: 'DATABASE_URL',
  REDIS_URL: 'REDIS_URL',
  JWT_SECRET: 'JWT_SECRET',
  API_KEY: 'API_KEY',
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  SENDGRID_API_KEY: 'SENDGRID_API_KEY'
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  AI_PROCESSING: 'AI_PROCESSING',
  CALENDAR_SYNC: 'CALENDAR_SYNC',
  EMAIL_AUTOMATION: 'EMAIL_AUTOMATION',
  TASK_MANAGEMENT: 'TASK_MANAGEMENT',
  PROACTIVE_AUTOMATION: 'PROACTIVE_AUTOMATION',
  ANALYTICS: 'ANALYTICS',
  MONITORING: 'MONITORING'
} as const;
