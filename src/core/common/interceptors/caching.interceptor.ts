/**
 * Caching Interceptor
 * Enterprise-grade caching with Redis support and intelligent cache management
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators';
import { IApiResponse } from '../types';
import { CACHE_KEYS, CACHE_TTL } from '../constants';
import * as crypto from 'crypto';

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(pattern?: string): Promise<void>;
  getHealth(): Promise<{ status: string; details?: any }>;
}

@Injectable()
export class CachingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CachingInterceptor.name);
  private readonly isEnabled: boolean;
  private readonly defaultTtl: number;
  private readonly keyPrefix: string;

  constructor(
    @Inject('CACHE_SERVICE') private readonly cacheService: ICacheService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) {
    this.isEnabled = this.configService.get('app.performance.enableCaching', true);
    this.defaultTtl = this.configService.get('app.performance.cacheTtl', CACHE_TTL.MEDIUM);
    this.keyPrefix = this.configService.get('app.name', 'executive-ai').toLowerCase().replace(/\s+/g, '-');
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    if (!this.isEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Check if caching is enabled for this handler
    const cacheTtl = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler());
    const customCacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());

    if (cacheTtl === undefined && !customCacheKey) {
      return next.handle();
    }

    try {
      const cacheKey = this.generateCacheKey(request, customCacheKey);
      const ttl = cacheTtl || this.defaultTtl;

      // Try to get from cache
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        this.setCacheHeaders(response, true, ttl);
        return of(cachedResult);
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);

      // Execute the handler and cache the result
      return next.handle().pipe(
        tap(async (result) => {
          await this.cacheResult(cacheKey, result, ttl);
          this.setCacheHeaders(response, false, ttl);
        })
      );

    } catch (error) {
      this.logger.error('Caching error, proceeding without cache', error);
      return next.handle();
    }
  }

  private generateCacheKey(request: Request, customKey?: string): string {
    if (customKey) {
      return `${this.keyPrefix}:${customKey}`;
    }

    // Generate key based on URL, query parameters, and user context
    const baseKey = `${request.method}:${request.path}`;
    const queryString = this.normalizeQueryString(request.query);
    const userContext = this.extractUserContext(request);

    const keyComponents = [baseKey];
    
    if (queryString) {
      keyComponents.push(`query:${queryString}`);
    }
    
    if (userContext) {
      keyComponents.push(`user:${userContext}`);
    }

    const fullKey = keyComponents.join('|');
    const hashedKey = crypto.createHash('sha256').update(fullKey).digest('hex').substring(0, 16);
    
    return `${this.keyPrefix}:${hashedKey}`;
  }

  private normalizeQueryString(query: any): string {
    if (!query || Object.keys(query).length === 0) {
      return '';
    }

    // Sort query parameters for consistent cache keys
    const sortedQuery = Object.keys(query)
      .sort()
      .reduce((result, key) => {
        result[key] = query[key];
        return result;
      }, {} as any);

    return JSON.stringify(sortedQuery);
  }

  private extractUserContext(request: Request): string {
    // Extract user ID or session ID for user-specific caching
    const user = (request as any).user;
    const sessionId = request.headers['x-session-id'] as string;
    const apiKey = request.headers['x-api-key'] as string;

    if (user?.id) {
      return `user:${user.id}`;
    }
    
    if (sessionId) {
      return `session:${sessionId}`;
    }
    
    if (apiKey) {
      const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 8);
      return `api:${hashedApiKey}`;
    }

    return '';
  }

  private async getCachedResult(key: string): Promise<any> {
    try {
      const cached = await this.cacheService.get<CachedResponse>(key);
      
      if (!cached) {
        return null;
      }

      // Check if cache entry has expired
      if (cached.expiresAt && new Date() > new Date(cached.expiresAt)) {
        await this.cacheService.del(key);
        return null;
      }

      // Update cache metadata
      cached.metadata.hits = (cached.metadata.hits || 0) + 1;
      cached.metadata.lastAccessed = new Date().toISOString();

      return cached.data;

    } catch (error) {
      this.logger.warn(`Failed to get cached result for key: ${key}`, error);
      return null;
    }
  }

  private async cacheResult(key: string, result: any, ttl: number): Promise<void> {
    try {
      // Don't cache error responses
      if (this.isErrorResponse(result)) {
        return;
      }

      // Don't cache large responses (configurable limit)
      const maxCacheSize = this.configService.get('app.performance.maxCacheSize', 1024 * 1024); // 1MB
      const resultSize = JSON.stringify(result).length;
      
      if (resultSize > maxCacheSize) {
        this.logger.warn(`Response too large to cache: ${resultSize} bytes for key: ${key}`);
        return;
      }

      const cachedResponse: CachedResponse = {
        data: result,
        metadata: {
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
          ttl,
          size: resultSize,
          hits: 0,
          version: '1.0.0'
        }
      };

      await this.cacheService.set(key, cachedResponse, ttl);
      this.logger.debug(`Cached result for key: ${key}, TTL: ${ttl}s, Size: ${resultSize} bytes`);

    } catch (error) {
      this.logger.warn(`Failed to cache result for key: ${key}`, error);
    }
  }

  private isErrorResponse(result: any): boolean {
    // Check if it's an API error response
    if (result && typeof result === 'object') {
      return result.success === false || result.error !== undefined;
    }
    return false;
  }

  private setCacheHeaders(response: Response, fromCache: boolean, ttl: number): void {
    if (fromCache) {
      response.setHeader('X-Cache', 'HIT');
      response.setHeader('X-Cache-TTL', ttl.toString());
    } else {
      response.setHeader('X-Cache', 'MISS');
    }
    
    response.setHeader('Cache-Control', `public, max-age=${ttl}`);
    response.setHeader('X-Cache-Key-Prefix', this.keyPrefix);
  }

  // Cache management methods
  public async invalidateCache(pattern?: string): Promise<void> {
    try {
      await this.cacheService.clear(pattern);
      this.logger.log(`Cache invalidated${pattern ? ` for pattern: ${pattern}` : ''}`);
    } catch (error) {
      this.logger.error('Failed to invalidate cache', error);
    }
  }

  public async getCacheHealth(): Promise<{ status: string; details?: any }> {
    try {
      return await this.cacheService.getHealth();
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }

  public getMetrics(): Record<string, unknown> {
    return {
      interceptor: 'CachingInterceptor',
      configuration: {
        isEnabled: this.isEnabled,
        defaultTtl: this.defaultTtl,
        keyPrefix: this.keyPrefix
      },
      timestamp: new Date().toISOString()
    };
  }
}

interface CachedResponse {
  data: any;
  metadata: {
    cachedAt: string;
    expiresAt: string;
    ttl: number;
    size: number;
    hits: number;
    version: string;
    lastAccessed?: string;
  };
}

// Cache invalidation decorator
export function InvalidateCache(pattern?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      // Invalidate cache after successful operation
      if (this.cachingInterceptor) {
        await this.cachingInterceptor.invalidateCache(pattern);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

// Cache warming decorator
export function WarmCache(keys: string[], ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      // Warm cache with predefined keys
      if (this.cachingInterceptor && this.cacheService) {
        for (const key of keys) {
          try {
            await this.cacheService.set(key, result, ttl);
          } catch (error) {
            // Log but don't fail the operation
            console.warn(`Failed to warm cache for key: ${key}`, error);
          }
        }
      }
      
      return result;
    };
    
    return descriptor;
  };
}
