/**
 * Executive Assistant AI - Response Transform Interceptor
 * Professional response transformation and standardization
 * 
 * @fileoverview Response transform interceptor providing:
 * - Automatic response formatting
 * - Performance metrics injection
 * - Error response standardization
 * - Cache control headers
 * - Response compression
 * 
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ResponseBuilder } from '../utils/response-builder.util';
import { RequestWithContext } from '../middleware/request-context.middleware';

/**
 * Response transform interceptor for standardizing API responses
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseTransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithContext>();
    const response = ctx.getResponse<Response>();
    const startTime = request.startTime || Date.now();

    return next.handle().pipe(
      map(data => this.transformResponse(data, request, response, startTime)),
      tap(transformedData => this.logResponse(request, response, transformedData)),
      catchError(error => {
        this.logError(request, error);
        throw error;
      }),
    );
  }

  /**
   * Transform response data to standard format
   */
  private transformResponse(
    data: any,
    request: RequestWithContext,
    response: Response,
    startTime: number,
  ): any {
    // Skip transformation for already formatted responses
    if (data && typeof data === 'object' && 'success' in data) {
      return data;
    }

    // Skip transformation for specific content types
    if (this.shouldSkipTransformation(request, response)) {
      return data;
    }

    // Set cache control headers
    this.setCacheHeaders(request, response);

    // Transform based on response status
    const statusCode = response.statusCode;
    const message = this.getSuccessMessage(request.method, request.path, statusCode);

    if (statusCode >= 200 && statusCode < 300) {
      return ResponseBuilder.success(
        data,
        message,
        statusCode,
        undefined,
        startTime,
      );
    }

    return data;
  }

  /**
   * Check if response transformation should be skipped
   */
  private shouldSkipTransformation(request: Request, response: Response): boolean {
    const contentType = response.getHeader('content-type') as string;
    
    // Skip for non-JSON responses
    if (contentType && !contentType.includes('application/json')) {
      return true;
    }

    // Skip for specific endpoints
    const skipPaths = ['/health/raw', '/metrics/raw'];
    return skipPaths.some(path => request.path.includes(path));
  }

  /**
   * Set appropriate cache headers
   */
  private setCacheHeaders(request: Request, response: Response): void {
    const method = request.method.toUpperCase();
    const path = request.path;

    // No cache for mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.setHeader('Pragma', 'no-cache');
      response.setHeader('Expires', '0');
      return;
    }

    // Cache settings based on endpoint
    if (path.includes('/health') || path.includes('/metrics')) {
      // Short cache for health/metrics
      response.setHeader('Cache-Control', 'public, max-age=30');
    } else if (path.includes('/docs') || path.includes('/architecture')) {
      // Longer cache for documentation
      response.setHeader('Cache-Control', 'public, max-age=3600');
    } else {
      // Default cache for data endpoints
      response.setHeader('Cache-Control', 'private, max-age=300');
    }
  }

  /**
   * Generate success message based on request
   */
  private getSuccessMessage(method: string, path: string, statusCode: number): string {
    const upperMethod = method.toUpperCase();
    
    switch (statusCode) {
      case 201:
        return 'Resource created successfully';
      case 202:
        return 'Request accepted for processing';
      case 204:
        return 'Operation completed successfully';
      default:
        break;
    }

    // Generate message based on method and path
    if (path.includes('/tasks')) {
      switch (upperMethod) {
        case 'GET':
          return 'Tasks retrieved successfully';
        case 'POST':
          return 'Task created successfully';
        case 'PUT':
        case 'PATCH':
          return 'Task updated successfully';
        case 'DELETE':
          return 'Task deleted successfully';
      }
    }

    if (path.includes('/assistant')) {
      switch (upperMethod) {
        case 'POST':
          return 'Assistant request processed successfully';
        case 'GET':
          return 'Assistant data retrieved successfully';
      }
    }

    if (path.includes('/calendar')) {
      switch (upperMethod) {
        case 'GET':
          return 'Calendar data retrieved successfully';
        case 'POST':
          return 'Calendar event created successfully';
      }
    }

    if (path.includes('/email')) {
      switch (upperMethod) {
        case 'POST':
          return 'Email sent successfully';
        case 'GET':
          return 'Email data retrieved successfully';
      }
    }

    // Default messages
    switch (upperMethod) {
      case 'GET':
        return 'Data retrieved successfully';
      case 'POST':
        return 'Resource created successfully';
      case 'PUT':
      case 'PATCH':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      default:
        return 'Operation completed successfully';
    }
  }

  /**
   * Log successful response
   */
  private logResponse(
    request: RequestWithContext,
    response: Response,
    data: any,
  ): void {
    const { method, path, requestId } = request;
    const { statusCode } = response;
    const responseTime = Date.now() - (request.startTime || 0);

    // Only log detailed info for errors or slow requests
    if (statusCode >= 400 || responseTime > 1000) {
      this.logger.warn(
        `${method} ${path} - ${statusCode} - ${responseTime}ms [${requestId}]`,
        {
          requestId,
          method,
          path,
          statusCode,
          responseTime,
          dataSize: JSON.stringify(data).length,
        },
      );
    } else {
      this.logger.debug(
        `${method} ${path} - ${statusCode} - ${responseTime}ms [${requestId}]`,
      );
    }
  }

  /**
   * Log error response
   */
  private logError(request: RequestWithContext, error: any): void {
    const { method, path, requestId } = request;
    const responseTime = Date.now() - (request.startTime || 0);

    this.logger.error(
      `${method} ${path} - ERROR - ${responseTime}ms [${requestId}]`,
      error.stack,
      {
        requestId,
        method,
        path,
        responseTime,
        error: error.message,
      },
    );
  }
}

/**
 * Performance monitoring interceptor
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowRequestThreshold = 1000; // 1 second

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithContext>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        
        // Log slow requests
        if (responseTime > this.slowRequestThreshold) {
          this.logger.warn(
            `Slow request detected: ${request.method} ${request.path} - ${responseTime}ms [${request.requestId}]`,
            {
              requestId: request.requestId,
              method: request.method,
              path: request.path,
              responseTime,
              userAgent: request.headers['user-agent'],
              ip: request.ip,
            },
          );
        }

        // Update performance metrics (if metrics service is available)
        this.updateMetrics(request, responseTime);
      }),
    );
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(request: RequestWithContext, responseTime: number): void {
    // This would integrate with a metrics service like Prometheus
    // For now, we'll just log the metrics
    this.logger.debug(
      `Performance metric: ${request.method} ${request.path} - ${responseTime}ms`,
    );
  }
}

/**
 * Security headers interceptor
 */
@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        // Additional security headers
        response.setHeader('X-Powered-By', 'Executive Assistant AI');
        response.setHeader('X-API-Version', '2.0.0');
        
        // Remove sensitive headers
        response.removeHeader('X-Powered-By');
        response.removeHeader('Server');
      }),
    );
  }
}
