/**
 * Executive Assistant AI - Request Context Middleware
 * Professional request tracking and context management
 * 
 * @fileoverview Request context middleware providing:
 * - Request ID generation and tracking
 * - Performance timing
 * - User context extraction
 * - Security headers
 * - Request logging
 * 
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended request interface with context
 */
export interface RequestWithContext extends Request {
  requestId: string;
  startTime: number;
  userContext?: {
    userId?: string;
    timezone?: string;
    preferences?: Record<string, any>;
  };
}

/**
 * Request context middleware for tracking and performance monitoring
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  use(req: RequestWithContext, res: Response, next: NextFunction): void {
    // Generate unique request ID
    req.requestId = req.headers['x-request-id'] as string || uuidv4();
    req.startTime = Date.now();

    // Set request ID in response headers
    res.setHeader('X-Request-ID', req.requestId);

    // Extract user context from headers
    this.extractUserContext(req);

    // Set security headers
    this.setSecurityHeaders(res);

    // Log request start
    this.logRequestStart(req);

    // Set up response logging
    this.setupResponseLogging(req, res);

    next();
  }

  /**
   * Extract user context from request headers
   */
  private extractUserContext(req: RequestWithContext): void {
    req.userContext = {
      userId: req.headers['x-user-id'] as string,
      timezone: req.headers['x-timezone'] as string || 'UTC',
      preferences: this.parseJsonHeader(req.headers['x-user-preferences'] as string),
    };
  }

  /**
   * Set security headers
   */
  private setSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Only set HSTS in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  }

  /**
   * Log request start
   */
  private logRequestStart(req: RequestWithContext): void {
    const { method, url, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';
    
    this.logger.log(
      `${method} ${url} - ${ip} - ${userAgent} [${req.requestId}]`,
    );
  }

  /**
   * Set up response logging
   */
  private setupResponseLogging(req: RequestWithContext, res: Response): void {
    const originalSend = res.send;
    
    res.send = function(body: any) {
      const responseTime = Date.now() - req.startTime;
      const { method, url } = req;
      const { statusCode } = res;
      
      // Log response
      const logger = new Logger(RequestContextMiddleware.name);
      logger.log(
        `${method} ${url} - ${statusCode} - ${responseTime}ms [${req.requestId}]`,
      );

      // Set response time header
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      
      return originalSend.call(this, body);
    };
  }

  /**
   * Parse JSON header safely
   */
  private parseJsonHeader(header: string): Record<string, any> | undefined {
    if (!header) return undefined;
    
    try {
      return JSON.parse(decodeURIComponent(header));
    } catch {
      return undefined;
    }
  }
}

/**
 * Rate limiting middleware
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor() {
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const key = this.getClientKey(req);
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create client record
    let clientRecord = this.requests.get(key);
    if (!clientRecord || clientRecord.resetTime <= now) {
      clientRecord = {
        count: 0,
        resetTime: now + this.windowMs,
      };
      this.requests.set(key, clientRecord);
    }

    // Increment request count
    clientRecord.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - clientRecord.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000));

    // Check if rate limit exceeded
    if (clientRecord.count > this.maxRequests) {
      this.logger.warn(`Rate limit exceeded for ${key}: ${clientRecord.count}/${this.maxRequests}`);
      
      res.status(429).json({
        success: false,
        statusCode: 429,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId || 'unknown',
          version: '2.0.0',
          responseTime: 0,
          environment: process.env.NODE_ENV || 'development',
        },
        details: {
          limit: this.maxRequests,
          remaining: 0,
          resetTime: Math.ceil(clientRecord.resetTime / 1000),
          resetDate: new Date(clientRecord.resetTime).toISOString(),
        },
      });
      return;
    }

    next();
  }

  /**
   * Get client identification key
   */
  private getClientKey(req: Request): string {
    // Use API key if available, otherwise use IP
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      return `api:${apiKey}`;
    }
    
    // Get real IP address
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    return `ip:${ip}`;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, record] of this.requests.entries()) {
      if (record.resetTime <= now) {
        this.requests.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }
}

/**
 * API key authentication middleware
 */
@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiKeyMiddleware.name);
  private readonly validApiKeys: Set<string>;

  constructor() {
    const apiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    const defaultKey = process.env.API_KEY;
    
    this.validApiKeys = new Set([
      ...apiKeys.map(key => key.trim()),
      ...(defaultKey ? [defaultKey] : []),
    ]);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Skip authentication for health checks and documentation
    if (this.isPublicEndpoint(req.path)) {
      return next();
    }

    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      this.logger.warn(`Missing API key for ${req.method} ${req.path} from ${req.ip}`);
      return this.sendUnauthorized(res, 'API key is required');
    }

    if (!this.validApiKeys.has(apiKey)) {
      this.logger.warn(`Invalid API key for ${req.method} ${req.path} from ${req.ip}`);
      return this.sendUnauthorized(res, 'Invalid API key');
    }

    next();
  }

  /**
   * Check if endpoint is public (no authentication required)
   */
  private isPublicEndpoint(path: string): boolean {
    const publicPaths = [
      '/health',
      '/api/docs',
      '/architecture',
      '/features',
      '/demo',
      '/',
    ];
    
    return publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath));
  }

  /**
   * Send unauthorized response
   */
  private sendUnauthorized(res: Response, message: string): void {
    res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'UNAUTHORIZED',
      message,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'unknown',
        version: '2.0.0',
        responseTime: 0,
        environment: process.env.NODE_ENV || 'development',
      },
    });
  }
}
