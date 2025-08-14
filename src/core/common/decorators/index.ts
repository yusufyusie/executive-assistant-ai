/**
 * Custom Decorators for Executive Assistant AI
 * Provides reusable decorators for common functionality
 */

import { SetMetadata, applyDecorators, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ValidateIf, ValidationOptions, registerDecorator, ValidationArguments } from 'class-validator';

// Metadata Keys
export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const RATE_LIMIT_METADATA = 'rate:limit';
export const ROLES_METADATA = 'roles';
export const PERMISSIONS_METADATA = 'permissions';
export const AUDIT_METADATA = 'audit';

/**
 * Cache Decorator
 * Enables caching for methods with configurable TTL
 */
export function Cache(ttl: number = 300, key?: string) {
  return applyDecorators(
    SetMetadata(CACHE_TTL_METADATA, ttl),
    SetMetadata(CACHE_KEY_METADATA, key)
  );
}

/**
 * Rate Limit Decorator
 * Applies rate limiting to endpoints
 */
export interface IRateLimitOptions {
  requests: number;
  window: string; // e.g., '1m', '1h', '1d'
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function RateLimit(options: IRateLimitOptions) {
  return SetMetadata(RATE_LIMIT_METADATA, options);
}

/**
 * Roles Decorator
 * Defines required roles for endpoint access
 */
export function Roles(...roles: string[]) {
  return SetMetadata(ROLES_METADATA, roles);
}

/**
 * Permissions Decorator
 * Defines required permissions for endpoint access
 */
export function RequirePermissions(...permissions: string[]) {
  return SetMetadata(PERMISSIONS_METADATA, permissions);
}

/**
 * Audit Decorator
 * Enables auditing for sensitive operations
 */
export interface IAuditOptions {
  action: string;
  resource: string;
  includeRequest?: boolean;
  includeResponse?: boolean;
}

export function Audit(options: IAuditOptions) {
  return SetMetadata(AUDIT_METADATA, options);
}

/**
 * API Documentation Decorators
 */
export function ApiEndpoint(options: {
  summary: string;
  description?: string;
  tags?: string[];
  auth?: boolean;
}) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description
    })
  ];

  if (options.tags) {
    decorators.push(ApiTags(...options.tags));
  }

  if (options.auth) {
    decorators.push(ApiBearerAuth());
  }

  return applyDecorators(...decorators);
}

export function ApiSuccessResponse(type?: any, description: string = 'Success') {
  return ApiResponse({
    status: 200,
    description,
    type
  });
}

export function ApiCreatedResponse(type?: any, description: string = 'Created') {
  return ApiResponse({
    status: 201,
    description,
    type
  });
}

export function ApiBadRequestResponse(description: string = 'Bad Request') {
  return ApiResponse({
    status: 400,
    description
  });
}

export function ApiUnauthorizedResponse(description: string = 'Unauthorized') {
  return ApiResponse({
    status: 401,
    description
  });
}

export function ApiForbiddenResponse(description: string = 'Forbidden') {
  return ApiResponse({
    status: 403,
    description
  });
}

export function ApiNotFoundResponse(description: string = 'Not Found') {
  return ApiResponse({
    status: 404,
    description
  });
}

export function ApiInternalServerErrorResponse(description: string = 'Internal Server Error') {
  return ApiResponse({
    status: 500,
    description
  });
}

/**
 * Validation Decorators
 */

/**
 * IsOptionalString - Validates optional string fields
 */
export function IsOptionalString(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ValidateIf((object, value) => value !== undefined && value !== null && value !== ''),
    Transform(({ value }) => value?.trim())
  );
}

/**
 * IsEmail - Enhanced email validation
 */
export function IsEmailEnhanced(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isEmailEnhanced',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) && value.length <= 254;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid email address`;
        }
      }
    });
  };
}

/**
 * IsUUID - Enhanced UUID validation
 */
export function IsUUIDEnhanced(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isUUIDEnhanced',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid UUID`;
        }
      }
    });
  };
}

/**
 * IsDateString - Enhanced date string validation
 */
export function IsDateStringEnhanced(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isDateStringEnhanced',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          const date = new Date(value);
          return !isNaN(date.getTime()) && date.toISOString() === value;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ISO date string`;
        }
      }
    });
  };
}

/**
 * IsPositiveNumber - Validates positive numbers
 */
export function IsPositiveNumber(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isPositiveNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'number' && value > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a positive number`;
        }
      }
    });
  };
}

/**
 * IsNonEmptyArray - Validates non-empty arrays
 */
export function IsNonEmptyArray(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isNonEmptyArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return Array.isArray(value) && value.length > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a non-empty array`;
        }
      }
    });
  };
}

/**
 * Transform Decorators
 */

/**
 * ToLowerCase - Transforms string to lowercase
 */
export function ToLowerCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return value;
  });
}

/**
 * ToUpperCase - Transforms string to uppercase
 */
export function ToUpperCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase().trim();
    }
    return value;
  });
}

/**
 * TrimString - Trims whitespace from strings
 */
export function TrimString() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  });
}

/**
 * ToBoolean - Transforms various values to boolean
 */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  });
}

/**
 * ToNumber - Transforms string to number
 */
export function ToNumber() {
  return Transform(({ value }) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    return value;
  });
}

/**
 * ToDate - Transforms string to Date object
 */
export function ToDate() {
  return Transform(({ value }) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }
    return value;
  });
}

/**
 * Performance Decorators
 */

/**
 * Measure - Measures method execution time
 */
export function Measure(logLevel: 'debug' | 'info' | 'warn' = 'debug') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const result = await method.apply(this, args);
      const duration = Date.now() - start;
      
      if (this.logger) {
        this.logger[logLevel](`Method ${propertyName} executed in ${duration}ms`);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Retry - Adds retry logic to methods
 */
export function Retry(attempts: number = 3, delay: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      let lastError: Error;
      
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await method.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === attempts) {
            throw lastError;
          }
          
          if (this.logger) {
            this.logger.warn(`Method ${propertyName} failed on attempt ${attempt}, retrying in ${delay}ms`);
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError!;
    };
    
    return descriptor;
  };
}
