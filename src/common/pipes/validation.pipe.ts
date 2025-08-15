/**
 * Executive Assistant AI - Professional Validation Pipe
 * Advanced validation with detailed error reporting
 * 
 * @fileoverview Professional validation pipe providing:
 * - Detailed validation error messages
 * - Custom validation rules
 * - Type transformation
 * - Security validation
 * - Performance optimization
 * 
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationErrorBuilder } from '../utils/response-builder.util';

/**
 * Professional validation pipe with enhanced error reporting
 */
@Injectable()
export class ProfessionalValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
    // Skip validation for primitive types
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToClass(metatype, value);
    
    // Perform validation
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      const validationErrorBuilder = new ValidationErrorBuilder();
      this.buildValidationErrors(errors, validationErrorBuilder);
      
      const validationResponse = validationErrorBuilder.build(
        'Request validation failed',
      );
      
      throw new BadRequestException(validationResponse);
    }

    return object;
  }

  /**
   * Check if type should be validated
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Build detailed validation errors
   */
  private buildValidationErrors(
    errors: ValidationError[],
    builder: ValidationErrorBuilder,
    parentPath: string = '',
  ): void {
    for (const error of errors) {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        this.buildValidationErrors(error.children, builder, fieldPath);
        continue;
      }

      // Handle constraint violations
      if (error.constraints) {
        for (const [constraint, message] of Object.entries(error.constraints)) {
          builder.addError(
            fieldPath,
            error.value,
            constraint,
            this.formatErrorMessage(message, fieldPath, constraint),
          );
        }
      }
    }
  }

  /**
   * Format error message for better user experience
   */
  private formatErrorMessage(
    message: string,
    fieldPath: string,
    constraint: string,
  ): string {
    // Custom formatting for common constraints
    switch (constraint) {
      case 'isNotEmpty':
        return `${this.formatFieldName(fieldPath)} is required and cannot be empty`;
      
      case 'isEmail':
        return `${this.formatFieldName(fieldPath)} must be a valid email address`;
      
      case 'isUrl':
        return `${this.formatFieldName(fieldPath)} must be a valid URL`;
      
      case 'isUUID':
        return `${this.formatFieldName(fieldPath)} must be a valid UUID`;
      
      case 'isString':
        return `${this.formatFieldName(fieldPath)} must be a text value`;
      
      case 'isNumber':
        return `${this.formatFieldName(fieldPath)} must be a number`;
      
      case 'isBoolean':
        return `${this.formatFieldName(fieldPath)} must be true or false`;
      
      case 'isArray':
        return `${this.formatFieldName(fieldPath)} must be an array`;
      
      case 'isObject':
        return `${this.formatFieldName(fieldPath)} must be an object`;
      
      case 'isEnum':
        return `${this.formatFieldName(fieldPath)} must be one of the allowed values`;
      
      case 'min':
        return `${this.formatFieldName(fieldPath)} must be at least the minimum value`;
      
      case 'max':
        return `${this.formatFieldName(fieldPath)} must not exceed the maximum value`;
      
      case 'minLength':
        return `${this.formatFieldName(fieldPath)} is too short`;
      
      case 'maxLength':
        return `${this.formatFieldName(fieldPath)} is too long`;
      
      case 'matches':
        return `${this.formatFieldName(fieldPath)} format is invalid`;
      
      case 'isDateString':
        return `${this.formatFieldName(fieldPath)} must be a valid date`;
      
      case 'whitelistValidation':
        return `${this.formatFieldName(fieldPath)} contains invalid properties`;
      
      default:
        return message;
    }
  }

  /**
   * Format field name for user-friendly display
   */
  private formatFieldName(fieldPath: string): string {
    // Convert camelCase and snake_case to readable format
    return fieldPath
      .split('.')
      .map(part => 
        part
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .toLowerCase()
          .trim()
          .replace(/^\w/, c => c.toUpperCase())
      )
      .join(' → ');
  }
}

/**
 * Custom validation decorators for business rules
 */
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validates that a string is a valid timezone
 */
export function IsTimezone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTimezone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          try {
            Intl.DateTimeFormat(undefined, { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid timezone`;
        },
      },
    });
  };
}

/**
 * Validates that a date is in the future
 */
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Allow optional dates
          
          const date = new Date(value);
          return date > new Date();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a future date`;
        },
      },
    });
  };
}

/**
 * Validates that a string contains only safe characters
 */
export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSafeString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          // Check for potentially dangerous characters
          const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
          ];
          
          return !dangerousPatterns.some(pattern => pattern.test(value));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contains potentially unsafe content`;
        },
      },
    });
  };
}

/**
 * Validates that a priority value is valid
 */
export function IsValidPriority(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPriority',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const validPriorities = ['low', 'medium', 'high', 'urgent'];
          return validPriorities.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be one of: low, medium, high, urgent`;
        },
      },
    });
  };
}

/**
 * Validates that a status value is valid
 */
export function IsValidTaskStatus(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidTaskStatus',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
          return validStatuses.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be one of: pending, in-progress, completed, cancelled`;
        },
      },
    });
  };
}
