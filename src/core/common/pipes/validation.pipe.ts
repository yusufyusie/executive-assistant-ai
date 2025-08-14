/**
 * Enhanced Validation Pipe
 * Enterprise-grade validation with detailed error reporting
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationException } from '../base/base.entity';
import { IValidationError, IValidationResult } from '../types';

@Injectable()
export class EnhancedValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(EnhancedValidationPipe.name);

  constructor(
    private readonly options: {
      transform?: boolean;
      whitelist?: boolean;
      forbidNonWhitelisted?: boolean;
      skipMissingProperties?: boolean;
      validateCustomDecorators?: boolean;
      enableDebugMessages?: boolean;
      stopAtFirstError?: boolean;
      groups?: string[];
    } = {}
  ) {
    // Set default options
    this.options = {
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      validateCustomDecorators: true,
      enableDebugMessages: false,
      stopAtFirstError: false,
      ...options
    };
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    const { metatype, type, data } = metadata;

    // Skip validation for primitive types
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToClass(metatype, value, {
      enableImplicitConversion: this.options.transform,
      excludeExtraneousValues: this.options.whitelist,
      exposeDefaultValues: true,
      enableCircularCheck: true
    });

    // Validate the object
    const validationResult = await this.validateObject(object, metatype.name);

    if (!validationResult.isValid) {
      this.logValidationErrors(validationResult.errors, metadata);
      throw new ValidationException(
        'Validation failed',
        {
          errors: validationResult.errors,
          target: metatype.name,
          type,
          data
        }
      );
    }

    return object;
  }

  private async validateObject(object: any, targetName: string): Promise<IValidationResult> {
    const validationErrors = await validate(object, {
      skipMissingProperties: this.options.skipMissingProperties,
      whitelist: this.options.whitelist,
      forbidNonWhitelisted: this.options.forbidNonWhitelisted,
      groups: this.options.groups,
      dismissDefaultMessages: false,
      validationError: {
        target: false,
        value: this.options.enableDebugMessages
      },
      stopAtFirstError: this.options.stopAtFirstError
    });

    if (validationErrors.length === 0) {
      return { isValid: true, errors: [] };
    }

    const formattedErrors = this.formatValidationErrors(validationErrors);
    
    return {
      isValid: false,
      errors: formattedErrors
    };
  }

  private formatValidationErrors(validationErrors: ValidationError[]): IValidationError[] {
    const errors: IValidationError[] = [];

    for (const error of validationErrors) {
      errors.push(...this.extractErrorsFromValidationError(error));
    }

    return errors;
  }

  private extractErrorsFromValidationError(
    error: ValidationError,
    parentPath: string = ''
  ): IValidationError[] {
    const errors: IValidationError[] = [];
    const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    // Add constraint errors
    if (error.constraints) {
      for (const [constraintKey, message] of Object.entries(error.constraints)) {
        errors.push({
          field: fieldPath,
          message: this.formatErrorMessage(message, error.property),
          value: error.value,
          constraints: { [constraintKey]: message }
        });
      }
    }

    // Recursively process nested errors
    if (error.children && error.children.length > 0) {
      for (const childError of error.children) {
        errors.push(...this.extractErrorsFromValidationError(childError, fieldPath));
      }
    }

    return errors;
  }

  private formatErrorMessage(message: string, fieldName: string): string {
    // Capitalize first letter and ensure proper field name formatting
    const formattedFieldName = this.formatFieldName(fieldName);
    
    // Replace generic field references with formatted field name
    return message
      .replace(/^[a-z]/, (char) => char.toUpperCase())
      .replace(/\b(property|field)\b/gi, formattedFieldName)
      .replace(new RegExp(`\\b${fieldName}\\b`, 'gi'), formattedFieldName);
  }

  private formatFieldName(fieldName: string): string {
    // Convert camelCase to readable format
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private logValidationErrors(errors: IValidationError[], metadata: ArgumentMetadata): void {
    if (this.options.enableDebugMessages) {
      this.logger.debug(
        `Validation failed for ${metadata.metatype?.name || 'unknown'}`,
        {
          type: metadata.type,
          data: metadata.data,
          errorsCount: errors.length,
          errors: errors.map(error => ({
            field: error.field,
            message: error.message,
            value: error.value
          }))
        }
      );
    }
  }

  // Factory method for creating pipe with specific options
  public static create(options: {
    transform?: boolean;
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
    skipMissingProperties?: boolean;
    validateCustomDecorators?: boolean;
    enableDebugMessages?: boolean;
    stopAtFirstError?: boolean;
    groups?: string[];
  } = {}): EnhancedValidationPipe {
    return new EnhancedValidationPipe(options);
  }

  // Predefined pipe configurations
  public static forBody(): EnhancedValidationPipe {
    return new EnhancedValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      stopAtFirstError: false
    });
  }

  public static forQuery(): EnhancedValidationPipe {
    return new EnhancedValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
      stopAtFirstError: false
    });
  }

  public static forParams(): EnhancedValidationPipe {
    return new EnhancedValidationPipe({
      transform: true,
      whitelist: false,
      forbidNonWhitelisted: false,
      skipMissingProperties: false,
      stopAtFirstError: true
    });
  }

  public static forDevelopment(): EnhancedValidationPipe {
    return new EnhancedValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      enableDebugMessages: true,
      stopAtFirstError: false
    });
  }

  public static forProduction(): EnhancedValidationPipe {
    return new EnhancedValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      enableDebugMessages: false,
      stopAtFirstError: true
    });
  }

  // Health check method
  public getHealth(): { status: string; details: any } {
    return {
      status: 'healthy',
      details: {
        pipe: 'EnhancedValidationPipe',
        options: this.options,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Metrics method
  public getMetrics(): Record<string, unknown> {
    return {
      pipe: 'EnhancedValidationPipe',
      configuration: this.options,
      timestamp: new Date().toISOString()
    };
  }
}
