/**
 * Rate Limiting Guard
 * Enterprise-grade rate limiting with Redis backend and intelligent throttling
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  Inject
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RATE_LIMIT_METADATA } from '../decorators';
import { IRateLimitOptions } from '../decorators';
import { ERROR_CODES } from '../constants';
import * as crypto from 'crypto';

export interface IRateLimitStorage {
  get(key: string): Promise<RateLimitData | null>;
  set(key: string, data: RateLimitData, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<RateLimitData>;
  reset(key: string): Promise<void>;
  getHealth(): Promise<{ status: string; details?: any }>;
}

interface RateLimitData {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly isEnabled: boolean;
  private readonly defaultOptions: IRateLimitOptions;

  constructor(
    @Inject('RATE_LIMIT_STORAGE') private readonly storage: IRateLimitStorage,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) {
    this.isEnabled = this.configService.get('app.rateLimit.enabled', true);
    this.defaultOptions = {
      requests: this.configService.get('app.rateLimit.max', 100),
      window: this.configService.get('app.rateLimit.windowMs', 900000), // 15 minutes
      skipSuccessfulRequests: this.configService.get('app.rateLimit.skipSuccessfulRequests', false),
      skipFailedRequests: this.configService.get('app.rateLimit.skipFailedRequests', false)
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.isEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get rate limit options from decorator or use defaults
    const rateLimitOptions = this.reflector.get<IRateLimitOptions>(
      RATE_LIMIT_METADATA,
      context.getHandler()
    ) || this.reflector.get<IRateLimitOptions>(
      RATE_LIMIT_METADATA,
      context.getClass()
    );

    if (!rateLimitOptions) {
      // No rate limiting configured for this endpoint
      return true;
    }

    try {
      const options = { ...this.defaultOptions, ...rateLimitOptions };
      const key = this.generateRateLimitKey(request, options);
      const windowMs = this.parseTimeWindow(options.window);
      
      const result = await this.checkRateLimit(key, options.requests, windowMs);
      
      // Set rate limit headers
      this.setRateLimitHeaders(response, result);

      if (!result.allowed) {
        this.logger.warn(`Rate limit exceeded for key: ${key}`, {
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          endpoint: `${request.method} ${request.path}`
        });

        throw new HttpException(
          {
            success: false,
            error: {
              code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
              message: 'Rate limit exceeded. Please try again later.',
              details: {
                limit: result.limit,
                remaining: result.remaining,
                resetTime: new Date(result.resetTime).toISOString(),
                retryAfter: result.retryAfter
              }
            }
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Log successful rate limit check
      this.logger.debug(`Rate limit check passed for key: ${key}`, {
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime
      });

      return true;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Rate limiting error, allowing request', error);
      return true; // Fail open for availability
    }
  }

  private generateRateLimitKey(request: Request, options: IRateLimitOptions): string {
    const keyComponents: string[] = [];

    // Add base identifier based on key generator strategy
    const keyGenerator = options.keyGenerator || 'ip';
    
    switch (keyGenerator) {
      case 'ip':
        keyComponents.push(`ip:${this.getClientIp(request)}`);
        break;
      case 'user':
        const user = (request as any).user;
        if (user?.id) {
          keyComponents.push(`user:${user.id}`);
        } else {
          keyComponents.push(`ip:${this.getClientIp(request)}`);
        }
        break;
      case 'api-key':
        const apiKey = request.headers['x-api-key'] as string;
        if (apiKey) {
          const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
          keyComponents.push(`api:${hashedKey}`);
        } else {
          keyComponents.push(`ip:${this.getClientIp(request)}`);
        }
        break;
      default:
        keyComponents.push(`ip:${this.getClientIp(request)}`);
    }

    // Add endpoint identifier
    keyComponents.push(`endpoint:${request.method}:${request.route?.path || request.path}`);

    // Add time window for key uniqueness
    const windowMs = this.parseTimeWindow(options.window);
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    keyComponents.push(`window:${windowStart}`);

    return `rate_limit:${keyComponents.join(':')}`;
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.ip ||
      'unknown'
    ).split(',')[0].trim();
  }

  private parseTimeWindow(window: string | number): number {
    if (typeof window === 'number') {
      return window;
    }

    const timeUnits: Record<string, number> = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = window.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time window format: ${window}`);
    }

    const [, value, unit] = match;
    return parseInt(value, 10) * timeUnits[unit];
  }

  private async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetTime = windowStart + windowMs;

    try {
      // Try to increment the counter
      const data = await this.storage.increment(key, Math.ceil(windowMs / 1000));
      
      const remaining = Math.max(0, limit - data.count);
      const allowed = data.count <= limit;
      
      const result: RateLimitResult = {
        allowed,
        limit,
        remaining,
        resetTime
      };

      if (!allowed) {
        result.retryAfter = Math.ceil((resetTime - now) / 1000);
      }

      return result;

    } catch (error) {
      this.logger.error(`Failed to check rate limit for key: ${key}`, error);
      
      // Fail open - allow the request
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetTime
      };
    }
  }

  private setRateLimitHeaders(response: Response, result: RateLimitResult): void {
    response.setHeader('X-RateLimit-Limit', result.limit.toString());
    response.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    
    if (result.retryAfter) {
      response.setHeader('Retry-After', result.retryAfter.toString());
    }
  }

  // Administrative methods
  public async resetRateLimit(identifier: string): Promise<void> {
    try {
      // This would need to be implemented based on the storage backend
      // For now, we'll use a pattern-based approach
      const pattern = `rate_limit:*${identifier}*`;
      await this.storage.reset(pattern);
      this.logger.log(`Rate limit reset for identifier: ${identifier}`);
    } catch (error) {
      this.logger.error(`Failed to reset rate limit for identifier: ${identifier}`, error);
      throw error;
    }
  }

  public async getRateLimitStatus(identifier: string): Promise<RateLimitData[]> {
    try {
      // This would return current rate limit status for the identifier
      // Implementation depends on storage backend capabilities
      return [];
    } catch (error) {
      this.logger.error(`Failed to get rate limit status for identifier: ${identifier}`, error);
      throw error;
    }
  }

  public async getHealth(): Promise<{ status: string; details?: any }> {
    try {
      const storageHealth = await this.storage.getHealth();
      
      return {
        status: storageHealth.status === 'healthy' ? 'healthy' : 'degraded',
        details: {
          guard: 'RateLimitGuard',
          isEnabled: this.isEnabled,
          defaultOptions: this.defaultOptions,
          storage: storageHealth,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          guard: 'RateLimitGuard',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  public getMetrics(): Record<string, unknown> {
    return {
      guard: 'RateLimitGuard',
      configuration: {
        isEnabled: this.isEnabled,
        defaultOptions: this.defaultOptions
      },
      timestamp: new Date().toISOString()
    };
  }
}

// In-memory rate limit storage implementation (for development)
@Injectable()
export class InMemoryRateLimitStorage implements IRateLimitStorage {
  private readonly storage = new Map<string, RateLimitData>();
  private readonly logger = new Logger(InMemoryRateLimitStorage.name);

  async get(key: string): Promise<RateLimitData | null> {
    return this.storage.get(key) || null;
  }

  async set(key: string, data: RateLimitData, ttl: number): Promise<void> {
    this.storage.set(key, data);
    
    // Set expiration
    setTimeout(() => {
      this.storage.delete(key);
    }, ttl * 1000);
  }

  async increment(key: string, ttl: number): Promise<RateLimitData> {
    const existing = this.storage.get(key);
    const now = Date.now();
    
    if (existing) {
      existing.count += 1;
      this.storage.set(key, existing);
      return existing;
    }

    const newData: RateLimitData = {
      count: 1,
      resetTime: now + (ttl * 1000),
      firstRequest: now
    };

    await this.set(key, newData, ttl);
    return newData;
  }

  async reset(key: string): Promise<void> {
    if (key.includes('*')) {
      // Pattern-based deletion
      const pattern = key.replace(/\*/g, '');
      for (const [k] of this.storage) {
        if (k.includes(pattern)) {
          this.storage.delete(k);
        }
      }
    } else {
      this.storage.delete(key);
    }
  }

  async getHealth(): Promise<{ status: string; details?: any }> {
    return {
      status: 'healthy',
      details: {
        storage: 'InMemoryRateLimitStorage',
        keysCount: this.storage.size,
        timestamp: new Date().toISOString()
      }
    };
  }
}
