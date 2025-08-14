/**
 * External Services Configuration
 * Configuration for all external service integrations
 */

import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { IExternalServiceConfig, IRateLimitConfig } from '../common/types';

// AI Service Configuration
export interface IAiServiceConfig extends IExternalServiceConfig {
  readonly provider: string;
  readonly model: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly topP: number;
  readonly topK: number;
  readonly safetySettings: IAiSafetySettings;
  readonly fallback: IAiFallbackConfig;
  readonly features: IAiFeatures;
  readonly quality: IAiQualityConfig;
}

export interface IAiSafetySettings {
  readonly harassment: string;
  readonly hateSpeech: string;
  readonly sexuallyExplicit: string;
  readonly dangerousContent: string;
}

export interface IAiFallbackConfig {
  readonly enabled: boolean;
  readonly usePatternMatching: boolean;
  readonly cacheResponses: boolean;
  readonly cacheTtl: number;
  readonly maxRetries: number;
  readonly retryDelay: number;
}

export interface IAiFeatures {
  readonly intentRecognition: boolean;
  readonly actionPlanning: boolean;
  readonly dailyBriefing: boolean;
  readonly contentAnalysis: boolean;
  readonly smartPrioritization: boolean;
  readonly sentimentAnalysis: boolean;
  readonly languageDetection: boolean;
  readonly summarization: boolean;
}

export interface IAiQualityConfig {
  readonly confidenceThreshold: number;
  readonly enableQualityCheck: boolean;
  readonly maxProcessingTime: number;
  readonly enableMetrics: boolean;
}

// Calendar Service Configuration
export interface ICalendarServiceConfig extends IExternalServiceConfig {
  readonly provider: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly refreshToken: string;
  readonly scopes: string[];
  readonly calendarId: string;
  readonly settings: ICalendarSettings;
  readonly features: ICalendarFeatures;
  readonly meetingPreferences: IMeetingPreferences;
}

export interface ICalendarSettings {
  readonly defaultTimezone: string;
  readonly workingHours: IWorkingHours;
  readonly bufferTime: number;
  readonly maxLookahead: number;
  readonly defaultDuration: number;
  readonly autoAcceptMeetings: boolean;
  readonly sendNotifications: boolean;
  readonly enableReminders: boolean;
  readonly defaultReminders: number[];
}

export interface IWorkingHours {
  readonly start: string;
  readonly end: string;
  readonly days: number[];
  readonly lunchBreak: ILunchBreak;
}

export interface ILunchBreak {
  readonly enabled: boolean;
  readonly start: string;
  readonly end: string;
}

export interface ICalendarFeatures {
  readonly conflictDetection: boolean;
  readonly intelligentScheduling: boolean;
  readonly availabilityChecking: boolean;
  readonly meetingOptimization: boolean;
  readonly analytics: boolean;
  readonly recurringMeetings: boolean;
  readonly roomBooking: boolean;
  readonly videoConferencing: boolean;
}

export interface IMeetingPreferences {
  readonly defaultLocation: string;
  readonly enableOnlineMeetings: boolean;
  readonly onlineMeetingProvider: string;
  readonly maxAttendees: number;
  readonly requireOrganizer: boolean;
}

// Email Service Configuration
export interface IEmailServiceConfig extends IExternalServiceConfig {
  readonly provider: string;
  readonly fromEmail: string;
  readonly fromName: string;
  readonly replyTo?: string;
  readonly templatePath: string;
  readonly apiVersion: string;
  readonly enableSandbox: boolean;
  readonly settings: IEmailSettings;
  readonly templates: IEmailTemplateConfig;
  readonly features: IEmailFeatures;
  readonly quality: IEmailQualityConfig;
}

export interface IEmailSettings {
  readonly defaultLanguage: string;
  readonly trackOpens: boolean;
  readonly trackClicks: boolean;
  readonly enableScheduling: boolean;
  readonly maxAttachmentSize: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly enableBounceHandling: boolean;
  readonly enableSpamCheck: boolean;
}

export interface IEmailTemplateConfig {
  readonly autoLoad: boolean;
  readonly customPath?: string;
  readonly cacheEnabled: boolean;
  readonly cacheTtl: number;
  readonly enableVersioning: boolean;
  readonly defaultTemplate: string;
}

export interface IEmailFeatures {
  readonly bulkEmail: boolean;
  readonly followUpSequences: boolean;
  readonly analytics: boolean;
  readonly aiComposition: boolean;
  readonly autoResponder: boolean;
  readonly emailSignature: boolean;
  readonly encryption: boolean;
}

export interface IEmailQualityConfig {
  readonly enableSpellCheck: boolean;
  readonly enableGrammarCheck: boolean;
  readonly enableToneAnalysis: boolean;
  readonly maxEmailLength: number;
  readonly enablePreview: boolean;
}

// GCP Configuration
export interface IGcpConfig {
  readonly projectId: string;
  readonly region: string;
  readonly schedulerTimezone: string;
  readonly serviceAccountKey?: string;
  readonly enableLogging: boolean;
  readonly enableMonitoring: boolean;
}

// Combined External Services Configuration
export interface IExternalServicesConfig {
  readonly ai: IAiServiceConfig;
  readonly calendar: ICalendarServiceConfig;
  readonly email: IEmailServiceConfig;
  readonly gcp: IGcpConfig;
}

// Validation Schemas
const aiConfigSchema = Joi.object({
  baseUrl: Joi.string().uri().default('https://generativelanguage.googleapis.com'),
  apiKey: Joi.string().required(),
  timeout: Joi.number().positive().default(30000),
  retryAttempts: Joi.number().min(0).max(5).default(3),
  retryDelay: Joi.number().positive().default(1000),
  provider: Joi.string().default('gemini'),
  model: Joi.string().default('gemini-2.0-flash-exp'),
  temperature: Joi.number().min(0).max(2).default(0.7),
  maxTokens: Joi.number().positive().default(2048),
  topP: Joi.number().min(0).max(1).default(0.9),
  topK: Joi.number().positive().default(40),
  safetySettings: Joi.object({
    harassment: Joi.string().default('BLOCK_MEDIUM_AND_ABOVE'),
    hateSpeech: Joi.string().default('BLOCK_MEDIUM_AND_ABOVE'),
    sexuallyExplicit: Joi.string().default('BLOCK_MEDIUM_AND_ABOVE'),
    dangerousContent: Joi.string().default('BLOCK_MEDIUM_AND_ABOVE')
  }).required(),
  fallback: Joi.object({
    enabled: Joi.boolean().default(true),
    usePatternMatching: Joi.boolean().default(false),
    cacheResponses: Joi.boolean().default(true),
    cacheTtl: Joi.number().positive().default(3600),
    maxRetries: Joi.number().min(0).max(5).default(3),
    retryDelay: Joi.number().positive().default(1000)
  }).required(),
  features: Joi.object({
    intentRecognition: Joi.boolean().default(true),
    actionPlanning: Joi.boolean().default(true),
    dailyBriefing: Joi.boolean().default(true),
    contentAnalysis: Joi.boolean().default(true),
    smartPrioritization: Joi.boolean().default(true),
    sentimentAnalysis: Joi.boolean().default(false),
    languageDetection: Joi.boolean().default(false),
    summarization: Joi.boolean().default(false)
  }).required(),
  quality: Joi.object({
    confidenceThreshold: Joi.number().min(0).max(1).default(0.7),
    enableQualityCheck: Joi.boolean().default(true),
    maxProcessingTime: Joi.number().positive().default(30000),
    enableMetrics: Joi.boolean().default(true)
  }).required()
});

const calendarConfigSchema = Joi.object({
  baseUrl: Joi.string().uri().default('https://www.googleapis.com/calendar/v3'),
  apiKey: Joi.string().optional(),
  timeout: Joi.number().positive().default(30000),
  retryAttempts: Joi.number().min(0).max(5).default(3),
  retryDelay: Joi.number().positive().default(1000),
  provider: Joi.string().default('google'),
  clientId: Joi.string().required(),
  clientSecret: Joi.string().required(),
  redirectUri: Joi.string().uri().required(),
  refreshToken: Joi.string().required(),
  scopes: Joi.array().items(Joi.string()).default([
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]),
  calendarId: Joi.string().default('primary'),
  settings: Joi.object({
    defaultTimezone: Joi.string().default('America/New_York'),
    workingHours: Joi.object({
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('17:00'),
      days: Joi.array().items(Joi.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
      lunchBreak: Joi.object({
        enabled: Joi.boolean().default(false),
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('12:00'),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('13:00')
      }).required()
    }).required(),
    bufferTime: Joi.number().min(0).max(60).default(15),
    maxLookahead: Joi.number().positive().default(90),
    defaultDuration: Joi.number().positive().default(60),
    autoAcceptMeetings: Joi.boolean().default(false),
    sendNotifications: Joi.boolean().default(true),
    enableReminders: Joi.boolean().default(true),
    defaultReminders: Joi.array().items(Joi.number().positive()).default([15, 60])
  }).required()
});

const emailConfigSchema = Joi.object({
  baseUrl: Joi.string().uri().default('https://api.sendgrid.com/v3'),
  apiKey: Joi.string().required(),
  timeout: Joi.number().positive().default(30000),
  retryAttempts: Joi.number().min(0).max(5).default(3),
  retryDelay: Joi.number().positive().default(5000),
  provider: Joi.string().default('sendgrid'),
  fromEmail: Joi.string().email().required(),
  fromName: Joi.string().required(),
  replyTo: Joi.string().email().optional(),
  templatePath: Joi.string().default('./templates'),
  apiVersion: Joi.string().default('v3'),
  enableSandbox: Joi.boolean().default(false),
  settings: Joi.object({
    defaultLanguage: Joi.string().default('en'),
    trackOpens: Joi.boolean().default(true),
    trackClicks: Joi.boolean().default(true),
    enableScheduling: Joi.boolean().default(true),
    maxAttachmentSize: Joi.number().positive().default(25 * 1024 * 1024),
    retryAttempts: Joi.number().min(0).max(5).default(3),
    retryDelay: Joi.number().positive().default(5000),
    enableBounceHandling: Joi.boolean().default(true),
    enableSpamCheck: Joi.boolean().default(true)
  }).required()
});

// Helper functions
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

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

const parseArray = (value: string | undefined, defaultValue: string[]): string[] => {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

const parseNumberArray = (value: string | undefined, defaultValue: number[]): number[] => {
  if (!value) return defaultValue;
  return value.split(',').map(item => parseInt(item.trim(), 10)).filter(item => !isNaN(item));
};

// Configuration Factory
export const externalServicesConfig = registerAs('externalServices', (): IExternalServicesConfig => {
  const config: IExternalServicesConfig = {
    ai: {
      baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com',
      apiKey: process.env.GEMINI_API_KEY || '',
      timeout: safeParseInt(process.env.GEMINI_TIMEOUT, 30000),
      retryAttempts: safeParseInt(process.env.GEMINI_RETRY_ATTEMPTS, 3),
      retryDelay: safeParseInt(process.env.GEMINI_RETRY_DELAY, 1000),
      provider: process.env.AI_PROVIDER || 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      temperature: safeParseFloat(process.env.GEMINI_TEMPERATURE, 0.7),
      maxTokens: safeParseInt(process.env.GEMINI_MAX_TOKENS, 2048),
      topP: safeParseFloat(process.env.GEMINI_TOP_P, 0.9),
      topK: safeParseInt(process.env.GEMINI_TOP_K, 40),
      safetySettings: {
        harassment: process.env.GEMINI_SAFETY_HARASSMENT || 'BLOCK_MEDIUM_AND_ABOVE',
        hateSpeech: process.env.GEMINI_SAFETY_HATE_SPEECH || 'BLOCK_MEDIUM_AND_ABOVE',
        sexuallyExplicit: process.env.GEMINI_SAFETY_SEXUALLY_EXPLICIT || 'BLOCK_MEDIUM_AND_ABOVE',
        dangerousContent: process.env.GEMINI_SAFETY_DANGEROUS || 'BLOCK_MEDIUM_AND_ABOVE'
      },
      fallback: {
        enabled: parseBoolean(process.env.AI_FALLBACK_ENABLED, true),
        usePatternMatching: parseBoolean(process.env.AI_FALLBACK_PATTERN_MATCHING, false),
        cacheResponses: parseBoolean(process.env.AI_CACHE_RESPONSES, true),
        cacheTtl: safeParseInt(process.env.AI_CACHE_TTL, 3600),
        maxRetries: safeParseInt(process.env.AI_MAX_RETRIES, 3),
        retryDelay: safeParseInt(process.env.AI_RETRY_DELAY, 1000)
      },
      features: {
        intentRecognition: parseBoolean(process.env.AI_INTENT_RECOGNITION, true),
        actionPlanning: parseBoolean(process.env.AI_ACTION_PLANNING, true),
        dailyBriefing: parseBoolean(process.env.AI_DAILY_BRIEFING, true),
        contentAnalysis: parseBoolean(process.env.AI_CONTENT_ANALYSIS, true),
        smartPrioritization: parseBoolean(process.env.AI_SMART_PRIORITIZATION, true),
        sentimentAnalysis: parseBoolean(process.env.AI_SENTIMENT_ANALYSIS, false),
        languageDetection: parseBoolean(process.env.AI_LANGUAGE_DETECTION, false),
        summarization: parseBoolean(process.env.AI_SUMMARIZATION, false)
      },
      quality: {
        confidenceThreshold: safeParseFloat(process.env.AI_CONFIDENCE_THRESHOLD, 0.7),
        enableQualityCheck: parseBoolean(process.env.AI_QUALITY_CHECK, true),
        maxProcessingTime: safeParseInt(process.env.AI_MAX_PROCESSING_TIME, 30000),
        enableMetrics: parseBoolean(process.env.AI_METRICS, true)
      }
    },

    calendar: {
      baseUrl: process.env.GOOGLE_CALENDAR_BASE_URL || 'https://www.googleapis.com/calendar/v3',
      apiKey: process.env.GOOGLE_API_KEY,
      timeout: safeParseInt(process.env.CALENDAR_TIMEOUT, 30000),
      retryAttempts: safeParseInt(process.env.CALENDAR_RETRY_ATTEMPTS, 3),
      retryDelay: safeParseInt(process.env.CALENDAR_RETRY_DELAY, 1000),
      provider: process.env.CALENDAR_PROVIDER || 'google',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
      scopes: parseArray(process.env.GOOGLE_SCOPES, [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]),
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      settings: {
        defaultTimezone: process.env.CALENDAR_DEFAULT_TIMEZONE || 'America/New_York',
        workingHours: {
          start: process.env.CALENDAR_WORK_START || '09:00',
          end: process.env.CALENDAR_WORK_END || '17:00',
          days: parseNumberArray(process.env.CALENDAR_WORK_DAYS, [1, 2, 3, 4, 5]),
          lunchBreak: {
            enabled: parseBoolean(process.env.CALENDAR_LUNCH_BREAK, false),
            start: process.env.CALENDAR_LUNCH_START || '12:00',
            end: process.env.CALENDAR_LUNCH_END || '13:00'
          }
        },
        bufferTime: safeParseInt(process.env.CALENDAR_BUFFER_TIME, 15),
        maxLookahead: safeParseInt(process.env.CALENDAR_MAX_LOOKAHEAD, 90),
        defaultDuration: safeParseInt(process.env.CALENDAR_DEFAULT_DURATION, 60),
        autoAcceptMeetings: parseBoolean(process.env.CALENDAR_AUTO_ACCEPT, false),
        sendNotifications: parseBoolean(process.env.CALENDAR_SEND_NOTIFICATIONS, true),
        enableReminders: parseBoolean(process.env.CALENDAR_REMINDERS, true),
        defaultReminders: parseNumberArray(process.env.CALENDAR_DEFAULT_REMINDERS, [15, 60])
      },
      features: {
        conflictDetection: parseBoolean(process.env.CALENDAR_CONFLICT_DETECTION, true),
        intelligentScheduling: parseBoolean(process.env.CALENDAR_INTELLIGENT_SCHEDULING, true),
        availabilityChecking: parseBoolean(process.env.CALENDAR_AVAILABILITY_CHECKING, true),
        meetingOptimization: parseBoolean(process.env.CALENDAR_MEETING_OPTIMIZATION, true),
        analytics: parseBoolean(process.env.CALENDAR_ANALYTICS, true),
        recurringMeetings: parseBoolean(process.env.CALENDAR_RECURRING_MEETINGS, true),
        roomBooking: parseBoolean(process.env.CALENDAR_ROOM_BOOKING, false),
        videoConferencing: parseBoolean(process.env.CALENDAR_VIDEO_CONFERENCING, true)
      },
      meetingPreferences: {
        defaultLocation: process.env.CALENDAR_DEFAULT_LOCATION || 'Conference Room',
        enableOnlineMeetings: parseBoolean(process.env.CALENDAR_ONLINE_MEETINGS, true),
        onlineMeetingProvider: process.env.CALENDAR_ONLINE_PROVIDER || 'google-meet',
        maxAttendees: safeParseInt(process.env.CALENDAR_MAX_ATTENDEES, 50),
        requireOrganizer: parseBoolean(process.env.CALENDAR_REQUIRE_ORGANIZER, false)
      }
    },

    email: {
      baseUrl: process.env.SENDGRID_BASE_URL || 'https://api.sendgrid.com/v3',
      apiKey: process.env.SENDGRID_API_KEY || '',
      timeout: safeParseInt(process.env.EMAIL_TIMEOUT, 30000),
      retryAttempts: safeParseInt(process.env.EMAIL_RETRY_ATTEMPTS, 3),
      retryDelay: safeParseInt(process.env.EMAIL_RETRY_DELAY, 5000),
      provider: process.env.EMAIL_PROVIDER || 'sendgrid',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'assistant@company.com',
      fromName: process.env.SENDGRID_FROM_NAME || 'Executive Assistant AI',
      replyTo: process.env.SENDGRID_REPLY_TO,
      templatePath: process.env.SENDGRID_TEMPLATE_PATH || './templates',
      apiVersion: process.env.SENDGRID_API_VERSION || 'v3',
      enableSandbox: parseBoolean(process.env.SENDGRID_SANDBOX, false),
      settings: {
        defaultLanguage: process.env.EMAIL_DEFAULT_LANGUAGE || 'en',
        trackOpens: parseBoolean(process.env.EMAIL_TRACK_OPENS, true),
        trackClicks: parseBoolean(process.env.EMAIL_TRACK_CLICKS, true),
        enableScheduling: parseBoolean(process.env.EMAIL_ENABLE_SCHEDULING, true),
        maxAttachmentSize: safeParseInt(process.env.EMAIL_MAX_ATTACHMENT_SIZE, 25 * 1024 * 1024),
        retryAttempts: safeParseInt(process.env.EMAIL_RETRY_ATTEMPTS, 3),
        retryDelay: safeParseInt(process.env.EMAIL_RETRY_DELAY, 5000),
        enableBounceHandling: parseBoolean(process.env.EMAIL_BOUNCE_HANDLING, true),
        enableSpamCheck: parseBoolean(process.env.EMAIL_SPAM_CHECK, true)
      },
      templates: {
        autoLoad: parseBoolean(process.env.EMAIL_TEMPLATES_AUTO_LOAD, true),
        customPath: process.env.EMAIL_TEMPLATES_CUSTOM_PATH,
        cacheEnabled: parseBoolean(process.env.EMAIL_TEMPLATES_CACHE, true),
        cacheTtl: safeParseInt(process.env.EMAIL_TEMPLATES_CACHE_TTL, 3600),
        enableVersioning: parseBoolean(process.env.EMAIL_TEMPLATES_VERSIONING, false),
        defaultTemplate: process.env.EMAIL_DEFAULT_TEMPLATE || 'default'
      },
      features: {
        bulkEmail: parseBoolean(process.env.EMAIL_BULK_ENABLED, true),
        followUpSequences: parseBoolean(process.env.EMAIL_FOLLOWUP_SEQUENCES, true),
        analytics: parseBoolean(process.env.EMAIL_ANALYTICS, true),
        aiComposition: parseBoolean(process.env.EMAIL_AI_COMPOSITION, false),
        autoResponder: parseBoolean(process.env.EMAIL_AUTO_RESPONDER, false),
        emailSignature: parseBoolean(process.env.EMAIL_SIGNATURE, true),
        encryption: parseBoolean(process.env.EMAIL_ENCRYPTION, false)
      },
      quality: {
        enableSpellCheck: parseBoolean(process.env.EMAIL_SPELL_CHECK, true),
        enableGrammarCheck: parseBoolean(process.env.EMAIL_GRAMMAR_CHECK, false),
        enableToneAnalysis: parseBoolean(process.env.EMAIL_TONE_ANALYSIS, false),
        maxEmailLength: safeParseInt(process.env.EMAIL_MAX_LENGTH, 10000),
        enablePreview: parseBoolean(process.env.EMAIL_PREVIEW, true)
      }
    },

    gcp: {
      projectId: process.env.GCP_PROJECT_ID || '',
      region: process.env.GCP_REGION || 'us-central1',
      schedulerTimezone: process.env.GCP_SCHEDULER_TIMEZONE || 'America/New_York',
      serviceAccountKey: process.env.GCP_SERVICE_ACCOUNT_KEY,
      enableLogging: parseBoolean(process.env.GCP_LOGGING, true),
      enableMonitoring: parseBoolean(process.env.GCP_MONITORING, true)
    }
  };

  // Validate each service configuration
  const { error: aiError } = aiConfigSchema.validate(config.ai);
  if (aiError) {
    throw new Error(`AI service configuration validation failed: ${aiError.message}`);
  }

  const { error: calendarError } = calendarConfigSchema.validate(config.calendar);
  if (calendarError) {
    throw new Error(`Calendar service configuration validation failed: ${calendarError.message}`);
  }

  const { error: emailError } = emailConfigSchema.validate(config.email);
  if (emailError) {
    throw new Error(`Email service configuration validation failed: ${emailError.message}`);
  }

  return config;
});
