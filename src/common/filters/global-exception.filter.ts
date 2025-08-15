/**
 * Executive Assistant AI - Global Exception Filter
 * Professional error handling with standardized responses
 * 
 * @fileoverview Global exception filter providing:
 * - Consistent error response formatting
 * - Proper HTTP status code mapping
 * - Security-aware error messages
 * - Comprehensive error logging
 * - Performance tracking
 * 
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseBuilder } from '../utils/response-builder.util';
import { API_ERROR_CODES } from '../types/api-response.types';

/**
 * Custom application exceptions
 */
export class BusinessLogicException extends Error {
  constructor(
    message: string,
    public readonly code: string = API_ERROR_CODES.OPERATION_NOT_ALLOWED,
    public readonly statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message);
    this.name = 'BusinessLogicException';
  }
}

export class ExternalServiceException extends Error {
  constructor(
    message: string,
    public readonly serviceName: string,
    public readonly originalError?: any,
    public readonly statusCode: HttpStatus = HttpStatus.BAD_GATEWAY,
  ) {
    super(message);
    this.name = 'ExternalServiceException';
  }
}

export class ConfigurationException extends Error {
  constructor(
    message: string,
    public readonly configKey?: string,
    public readonly statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.name = 'ConfigurationException';
  }
}

export class RateLimitException extends Error {
  constructor(
    message: string,
    public readonly resetTime: number,
    public readonly statusCode: HttpStatus = HttpStatus.TOO_MANY_REQUESTS,
  ) {
    super(message);
    this.name = 'RateLimitException';
  }
}

/**
 * Global exception filter for standardized error handling
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestStartTime = (request as any).startTime;

    // Log the exception
    this.logException(exception, request);

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      this.handleHttpException(exception, response, requestStartTime);
    } else if (exception instanceof BusinessLogicException) {
      this.handleBusinessLogicException(exception, response, requestStartTime);
    } else if (exception instanceof ExternalServiceException) {
      this.handleExternalServiceException(exception, response, requestStartTime);
    } else if (exception instanceof ConfigurationException) {
      this.handleConfigurationException(exception, response, requestStartTime);
    } else if (exception instanceof RateLimitException) {
      this.handleRateLimitException(exception, response, requestStartTime);
    } else {
      this.handleUnknownException(exception, response, requestStartTime);
    }
  }

  /**
   * Handle HTTP exceptions (from NestJS)
   */
  private handleHttpException(
    exception: HttpException,
    response: Response,
    requestStartTime?: number,
  ): void {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorCode: string;
    let message: string;
    let details: any;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || exception.message;
      details = responseObj.details;
      
      // Map HTTP status to error codes
      errorCode = this.mapHttpStatusToErrorCode(status);
    } else {
      message = exceptionResponse as string;
      errorCode = this.mapHttpStatusToErrorCode(status);
    }

    const errorResponse = ResponseBuilder.error(
      errorCode,
      message,
      status,
      details,
      requestStartTime,
      this.shouldIncludeStack() ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }

  /**
   * Handle business logic exceptions
   */
  private handleBusinessLogicException(
    exception: BusinessLogicException,
    response: Response,
    requestStartTime?: number,
  ): void {
    const errorResponse = ResponseBuilder.error(
      exception.code,
      exception.message,
      exception.statusCode,
      undefined,
      requestStartTime,
      this.shouldIncludeStack() ? exception.stack : undefined,
    );

    response.status(exception.statusCode).json(errorResponse);
  }

  /**
   * Handle external service exceptions
   */
  private handleExternalServiceException(
    exception: ExternalServiceException,
    response: Response,
    requestStartTime?: number,
  ): void {
    const errorResponse = ResponseBuilder.externalServiceError(
      exception.serviceName,
      exception.originalError,
      requestStartTime,
    );

    response.status(exception.statusCode).json(errorResponse);
  }

  /**
   * Handle configuration exceptions
   */
  private handleConfigurationException(
    exception: ConfigurationException,
    response: Response,
    requestStartTime?: number,
  ): void {
    const errorResponse = ResponseBuilder.error(
      API_ERROR_CODES.CONFIGURATION_ERROR,
      this.isProduction() 
        ? 'Service configuration error' 
        : exception.message,
      exception.statusCode,
      this.isProduction() ? undefined : { configKey: exception.configKey },
      requestStartTime,
      this.shouldIncludeStack() ? exception.stack : undefined,
    );

    response.status(exception.statusCode).json(errorResponse);
  }

  /**
   * Handle rate limit exceptions
   */
  private handleRateLimitException(
    exception: RateLimitException,
    response: Response,
    requestStartTime?: number,
  ): void {
    const errorResponse = ResponseBuilder.rateLimitExceeded(
      exception.resetTime,
      requestStartTime,
    );

    response.status(exception.statusCode).json(errorResponse);
  }

  /**
   * Handle unknown exceptions
   */
  private handleUnknownException(
    exception: unknown,
    response: Response,
    requestStartTime?: number,
  ): void {
    const message = this.isProduction()
      ? 'Internal server error'
      : exception instanceof Error
      ? exception.message
      : 'Unknown error occurred';

    const errorResponse = ResponseBuilder.error(
      API_ERROR_CODES.INTERNAL_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      requestStartTime,
      this.shouldIncludeStack() && exception instanceof Error 
        ? exception.stack 
        : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
  }

  /**
   * Log exception details
   */
  private logException(exception: unknown, request: Request): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';

    const logContext = {
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof Error) {
      this.logger.error(
        `${exception.name}: ${exception.message}`,
        exception.stack,
        JSON.stringify(logContext),
      );
    } else {
      this.logger.error(
        `Unknown exception: ${String(exception)}`,
        undefined,
        JSON.stringify(logContext),
      );
    }
  }

  /**
   * Map HTTP status codes to error codes
   */
  private mapHttpStatusToErrorCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return API_ERROR_CODES.INVALID_INPUT;
      case HttpStatus.UNAUTHORIZED:
        return API_ERROR_CODES.INVALID_CREDENTIALS;
      case HttpStatus.FORBIDDEN:
        return API_ERROR_CODES.INSUFFICIENT_PERMISSIONS;
      case HttpStatus.NOT_FOUND:
        return API_ERROR_CODES.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return API_ERROR_CODES.RESOURCE_ALREADY_EXISTS;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return API_ERROR_CODES.VALIDATION_FAILED;
      case HttpStatus.TOO_MANY_REQUESTS:
        return API_ERROR_CODES.RATE_LIMIT_EXCEEDED;
      case HttpStatus.BAD_GATEWAY:
        return API_ERROR_CODES.EXTERNAL_SERVICE_ERROR;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return API_ERROR_CODES.SERVICE_UNAVAILABLE;
      default:
        return API_ERROR_CODES.INTERNAL_ERROR;
    }
  }

  /**
   * Check if running in production
   */
  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Check if stack traces should be included
   */
  private shouldIncludeStack(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}
