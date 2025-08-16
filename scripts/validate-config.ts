#!/usr/bin/env ts-node

/**
 * Configuration Validation Script
 * Validates all configuration settings and provides detailed feedback
 */

import 'reflect-metadata';
import { config } from 'dotenv';

// Load environment variables
config();

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalConfigs: number;
    validConfigs: number;
    missingOptional: number;
    criticalErrors: number;
  };
}

/**
 * Comprehensive configuration validation
 */
function validateConfiguration(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    summary: {
      totalConfigs: 0,
      validConfigs: 0,
      missingOptional: 0,
      criticalErrors: 0,
    },
  };

  try {
    // Simple validation without complex configuration classes
    const basicErrors: string[] = [];
    result.errors.push(...basicErrors);

    // Environment-specific validation
    const env = process.env.NODE_ENV || 'development';
    
    // Check required API keys
    const requiredKeys = [
      { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY, critical: true },
      { key: 'GOOGLE_CLIENT_ID', value: process.env.GOOGLE_CLIENT_ID, critical: env === 'production' },
      { key: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET, critical: env === 'production' },
      { key: 'SENDGRID_API_KEY', value: process.env.SENDGRID_API_KEY, critical: env === 'production' },
      { key: 'JWT_SECRET', value: process.env.JWT_SECRET, critical: env === 'production' },
    ];

    requiredKeys.forEach(({ key, value, critical }) => {
      result.summary.totalConfigs++;
      
      if (!value || value.trim() === '') {
        if (critical) {
          result.errors.push(`${key} is required for ${env} environment`);
          result.summary.criticalErrors++;
        } else {
          result.warnings.push(`${key} is not set (optional for ${env})`);
          result.summary.missingOptional++;
        }
      } else {
        result.summary.validConfigs++;
      }
    });

    // Validate port
    const port = parseInt(process.env.PORT || '3000', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      result.errors.push('PORT must be a valid number between 1 and 65535');
      result.summary.criticalErrors++;
    } else {
      result.summary.validConfigs++;
    }
    result.summary.totalConfigs++;

    // Validate email format
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (fromEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fromEmail)) {
        result.errors.push('SENDGRID_FROM_EMAIL must be a valid email address');
        result.summary.criticalErrors++;
      } else {
        result.summary.validConfigs++;
      }
      result.summary.totalConfigs++;
    }

    // Validate numeric configurations
    const numericConfigs = [
      { key: 'GEMINI_MAX_TOKENS', min: 1, max: 4000 },
      { key: 'GEMINI_TEMPERATURE', min: 0, max: 2 },
      { key: 'RATE_LIMIT_MAX', min: 1, max: 10000 },
      { key: 'CACHE_DEFAULT_TTL', min: 1, max: 3600 },
    ];

    numericConfigs.forEach(({ key, min, max }) => {
      const value = process.env[key];
      if (value) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < min || numValue > max) {
          result.warnings.push(`${key} should be between ${min} and ${max}`);
        } else {
          result.summary.validConfigs++;
        }
        result.summary.totalConfigs++;
      }
    });

    // Check feature flags
    const featureFlags = [
      'FEATURE_AI_ASSISTANT',
      'FEATURE_CALENDAR_INTEGRATION',
      'FEATURE_EMAIL_AUTOMATION',
      'FEATURE_TASK_MANAGEMENT',
      'FEATURE_PROACTIVE_AUTOMATION',
      'FEATURE_ANALYTICS',
    ];

    featureFlags.forEach(flag => {
      const value = process.env[flag];
      if (value && !['true', 'false'].includes(value.toLowerCase())) {
        result.warnings.push(`${flag} should be 'true' or 'false'`);
      }
      result.summary.totalConfigs++;
    });

    // Determine overall validity
    result.isValid = result.errors.length === 0;

  } catch (error) {
    result.errors.push(`Configuration validation failed: ${error.message}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Display validation results
 */
function displayResults(result: ValidationResult): void {
  console.log('\n🔧 Executive Assistant AI - Configuration Validation\n');
  
  // Summary
  console.log('📊 Summary:');
  console.log(`   Total Configurations: ${result.summary.totalConfigs}`);
  console.log(`   Valid Configurations: ${result.summary.validConfigs}`);
  console.log(`   Missing Optional: ${result.summary.missingOptional}`);
  console.log(`   Critical Errors: ${result.summary.criticalErrors}`);
  
  // Overall status
  if (result.isValid) {
    console.log('\n✅ Configuration is VALID');
  } else {
    console.log('\n❌ Configuration has ERRORS');
  }

  // Errors
  if (result.errors.length > 0) {
    console.log('\n🚨 Errors:');
    result.errors.forEach(error => console.log(`   ❌ ${error}`));
  }

  // Warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  }

  // Environment info
  console.log('\n🌍 Environment Information:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   PORT: ${process.env.PORT || '3000'}`);
  console.log(`   LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}`);

  // Feature flags status
  console.log('\n🎛️  Feature Flags:');
  const features = [
    'FEATURE_AI_ASSISTANT',
    'FEATURE_CALENDAR_INTEGRATION',
    'FEATURE_EMAIL_AUTOMATION',
    'FEATURE_TASK_MANAGEMENT',
    'FEATURE_PROACTIVE_AUTOMATION',
    'FEATURE_ANALYTICS',
  ];
  
  features.forEach(feature => {
    const enabled = process.env[feature] !== 'false';
    console.log(`   ${enabled ? '✅' : '❌'} ${feature}: ${enabled ? 'enabled' : 'disabled'}`);
  });

  console.log('\n');
}

// Run validation
if (require.main === module) {
  const result = validateConfiguration();
  displayResults(result);
  
  // Exit with appropriate code
  process.exit(result.isValid ? 0 : 1);
}

export { validateConfiguration };
export type { ValidationResult };
