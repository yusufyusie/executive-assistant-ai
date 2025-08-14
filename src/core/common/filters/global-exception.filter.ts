/**
 * Global Exception Filter
 * Enterprise-grade error handling with proper HTTP status codes and logging
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { 
  BaseException, 
  DomainException, 
  ApplicationException,
  ValidationException,
  NotFoundExceptionDomain,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  ExternalServiceException,
  ConfigurationException
} from '../base/base.entity';
import { 
  IApiErrorResponse, 
  IErrorDetails, 
  IResponseMetadata,
  HttpStatusCode,
  Environment
} from '../types';
import { ERROR_CODES } from '../constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isDevelopment: boolean;
  private readonly includeStackTrace: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment = this.configService.get('app.environment') === Environment.DEVELOPMENT;
    this.includeStackTrace = this.configService.get('app.debug', false);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = this.getRequestId(request);
    const errorResponse = this.buildErrorResponse(exception, requestId, request);

    // Log the error
    this.logError(exception, request, requestId, errorResponse);

    // Send response
    response
      .status(errorResponse.error.code === 'VALIDATION_ERROR' ? HttpStatusCode.BAD_REQUEST : this.getHttpStatus(exception))
      .json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown, 
    requestId: string, 
    request: Request
  ): IApiErrorResponse {
    const timestamp = new Date().toISOString();
    const version = this.configService.get('app.version', '1.0.0');

    const metadata: IResponseMetadata = {
      timestamp,
      requestId,
      version
    };

    // Handle different exception types
    if (exception instanceof BaseException) {
      return {
        success: false,
        error: this.buildDomainErrorDetails(exception, request),
        metadata
      };
    }

    if (exception instanceof HttpException) {
      return {
        success: false,
        error: this.buildHttpErrorDetails(exception, request),
        metadata
      };
    }

    if (exception instanceof Error) {
      return {
        success: false,
        error: this.buildGenericErrorDetails(exception, request),
        metadata
      };
    }

    // Unknown exception type
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        timestamp,
        requestId,
        path: request.url,
        stack: this.includeStackTrace ? String(exception) : undefined
      },
      metadata
    };
  }

  private buildDomainErrorDetails(exception: BaseException, request: Request): IErrorDetails {
    const errorDetails: IErrorDetails = {
      code: exception.code,
      message: exception.message,
      timestamp: exception.timestamp.toISOString(),
      requestId: this.getRequestId(request),
      path: request.url
    };

    // Add context if available
    if (exception.context && Object.keys(exception.context).length > 0) {
      errorDetails.details = exception.context;
    }

    // Add stack trace in development
    if (this.includeStackTrace) {
      errorDetails.stack = exception.stack;
    }

    return errorDetails;
  }

  private buildHttpErrorDetails(exception: HttpException, request: Request): IErrorDetails {
    const response = exception.getResponse();
    const message = typeof response === 'string' ? response : (response as any).message || exception.message;
    
    return {
      code: this.mapHttpStatusToErrorCode(exception.getStatus()),
      message: Array.isArray(message) ? message.join(', ') : message,
      timestamp: new Date().toISOString(),
      requestId: this.getRequestId(request),
      path: request.url,
      details: typeof response === 'object' ? response : undefined,
      stack: this.includeStackTrace ? exception.stack : undefined
    };
  }

  private buildGenericErrorDetails(exception: Error, request: Request): IErrorDetails {
    return {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: this.isDevelopment ? exception.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId: this.getRequestId(request),
      path: request.url,
      stack: this.includeStackTrace ? exception.stack : undefined
    };
  }

  private getHttpStatus(exception: unknown): number {
    // Domain exceptions mapping
    if (exception instanceof ValidationException) {
      return HttpStatusCode.BAD_REQUEST;
    }
    if (exception instanceof NotFoundExceptionDomain) {
      return HttpStatusCode.NOT_FOUND;
    }
    if (exception instanceof ConflictException) {
      return HttpStatusCode.CONFLICT;
    }
    if (exception instanceof UnauthorizedException) {
      return HttpStatusCode.UNAUTHORIZED;
    }
    if (exception instanceof ForbiddenException) {
      return HttpStatusCode.FORBIDDEN;
    }
    if (exception instanceof ExternalServiceException) {
      return HttpStatusCode.BAD_GATEWAY;
    }
    if (exception instanceof ConfigurationException) {
      return HttpStatusCode.INTERNAL_SERVER_ERROR;
    }
    if (exception instanceof DomainException) {
      return HttpStatusCode.BAD_REQUEST;
    }
    if (exception instanceof ApplicationException) {
      return HttpStatusCode.INTERNAL_SERVER_ERROR;
    }

    // HTTP exceptions
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    // Default to internal server error
    return HttpStatusCode.INTERNAL_SERVER_ERROR;
  }

  private mapHttpStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatusCode.BAD_REQUEST:
        return ERROR_CODES.VALIDATION_ERROR;
      case HttpStatusCode.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHORIZED;
      case HttpStatusCode.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN;
      case HttpStatusCode.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatusCode.CONFLICT:
        return ERROR_CODES.CONFLICT;
      case HttpStatusCode.UNPROCESSABLE_ENTITY:
        return ERROR_CODES.VALIDATION_ERROR;
      case HttpStatusCode.TOO_MANY_REQUESTS:
        return ERROR_CODES.RATE_LIMIT_EXCEEDED;
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
        return ERROR_CODES.INTERNAL_SERVER_ERROR;
      case HttpStatusCode.BAD_GATEWAY:
        return ERROR_CODES.EXTERNAL_SERVICE_ERROR;
      case HttpStatusCode.SERVICE_UNAVAILABLE:
        return ERROR_CODES.EXTERNAL_SERVICE_ERROR;
      default:
        return ERROR_CODES.INTERNAL_SERVER_ERROR;
    }
  }

  private getRequestId(request: Request): string {
    // Try to get request ID from headers
    const requestId = request.headers['x-request-id'] || 
                     request.headers['x-correlation-id'] ||
                     (request as any).requestId;
    
    return typeof requestId === 'string' ? requestId : uuidv4();
  }

  private logError(
    exception: unknown, 
    request: Request, 
    requestId: string, 
    errorResponse: IApiErrorResponse
  ): void {
    const logContext = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      errorCode: errorResponse.error.code,
      statusCode: this.getHttpStatus(exception)
    };

    // Log level based on error type and status
    const status = this.getHttpStatus(exception);
    
    if (status >= 500) {
      // Server errors - log as error with full details
      this.logger.error(
        `Server Error: ${errorResponse.error.message}`,
        {
          ...logContext,
          stack: exception instanceof Error ? exception.stack : undefined,
          details: errorResponse.error.details
        }
      );
    } else if (status >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `Client Error: ${errorResponse.error.message}`,
        logContext
      );
    } else {
      // Other errors - log as info
      this.logger.log(
        `Request Error: ${errorResponse.error.message}`,
        logContext
      );
    }

    // Additional logging for specific exception types
    if (exception instanceof ExternalServiceException) {
      this.logger.error(
        `External Service Error: ${exception.message}`,
        {
          ...logContext,
          service: exception.context?.service,
          serviceError: exception.context
        }
      );
    }

    if (exception instanceof ValidationException) {
      this.logger.debug(
        `Validation Error: ${exception.message}`,
        {
          ...logContext,
          validationErrors: exception.context
        }
      );
    }
  }

  // Health check method for the filter itself
  public getHealth(): { status: string; details: any } {
    return {
      status: 'healthy',
      details: {
        filter: 'GlobalExceptionFilter',
        isDevelopment: this.isDevelopment,
        includeStackTrace: this.includeStackTrace,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Metrics method
  public getMetrics(): Record<string, unknown> {
    return {
      filter: 'GlobalExceptionFilter',
      configuration: {
        isDevelopment: this.isDevelopment,
        includeStackTrace: this.includeStackTrace
      },
      timestamp: new Date().toISOString()
    };
  }
}
