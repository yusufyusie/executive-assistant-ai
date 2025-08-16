/**
 * API Key Guard - Infrastructure Layer
 * Production-ready security for API endpoints
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly validApiKeys: Set<string>;

  constructor(private readonly configService: ConfigService) {
    // In production, these would come from a secure key management system
    const apiKey = this.configService.get<string>('security.apiKey');
    const additionalKeys = this.configService.get<string>(
      'ADDITIONAL_API_KEYS',
      '',
    );

    this.validApiKeys = new Set(
      [apiKey, ...additionalKeys.split(',').filter((key) => key.trim())].filter(
        (key): key is string => Boolean(key),
      ),
    );

    this.logger.log(
      `Initialized with ${this.validApiKeys.size} valid API keys`,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      this.logger.warn(`API key missing for ${request.method} ${request.url}`);
      throw new UnauthorizedException('API key is required');
    }

    if (!this.isValidApiKey(apiKey)) {
      this.logger.warn(
        `Invalid API key attempted for ${request.method} ${request.url}`,
      );
      throw new UnauthorizedException('Invalid API key');
    }

    // Add API key info to request for logging/auditing
    (request as any).apiKeyInfo = {
      keyId: this.hashApiKey(apiKey),
      timestamp: new Date().toISOString(),
    };

    return true;
  }

  private extractApiKey(request: Request): string | null {
    // Check X-API-Key header (primary)
    const headerKey = request.headers['x-api-key'] as string;
    if (headerKey) return headerKey;

    // Check Authorization header (Bearer token format)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter (less secure, for development only)
    const queryKey = request.query.api_key as string;
    if (
      queryKey &&
      this.configService.get('app.environment') !== 'production'
    ) {
      return queryKey;
    }

    return null;
  }

  private isValidApiKey(apiKey: string): boolean {
    return this.validApiKeys.has(apiKey);
  }

  private hashApiKey(apiKey: string): string {
    // Simple hash for logging (not cryptographically secure)
    return `key_${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
  }
}

/**
 * Rate Limiting Guard
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(private readonly configService: ConfigService) {
    this.maxRequests = this.configService.get<number>(
      'performance.rateLimitMax',
      100,
    );
    this.windowMs = this.configService.get<number>(
      'performance.rateLimitTtl',
      60000,
    );

    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const identifier = this.getIdentifier(request);
    const now = Date.now();

    const record = this.requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
      // New window or expired window
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxRequests) {
      this.logger.warn(`Rate limit exceeded for ${identifier}`);
      throw new UnauthorizedException('Rate limit exceeded');
    }

    record.count++;
    return true;
  }

  private getIdentifier(request: Request): string {
    // Use API key if available, otherwise fall back to IP
    const apiKeyInfo = (request as any).apiKeyInfo;
    if (apiKeyInfo?.keyId) {
      return apiKeyInfo.keyId;
    }

    // Get real IP address (considering proxies)
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown';

    return `ip_${ip}`;
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.requestCounts.delete(key));

    if (toDelete.length > 0) {
      this.logger.debug(
        `Cleaned up ${toDelete.length} expired rate limit records`,
      );
    }
  }
}

/**
 * Request Validation Guard
 */
@Injectable()
export class RequestValidationGuard implements CanActivate {
  private readonly logger = new Logger(RequestValidationGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers['content-type'];
      if (contentType && !contentType.includes('application/json')) {
        this.logger.warn(`Invalid content type: ${contentType}`);
        throw new UnauthorizedException(
          'Content-Type must be application/json',
        );
      }
    }

    // Validate request size (basic protection against large payloads)
    const contentLength = request.headers['content-length'];
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      // 10MB limit
      this.logger.warn(`Request too large: ${contentLength} bytes`);
      throw new UnauthorizedException('Request payload too large');
    }

    // Add request metadata for auditing
    (request as any).requestMetadata = {
      timestamp: new Date().toISOString(),
      userAgent: request.headers['user-agent'],
      origin: request.headers.origin,
      referer: request.headers.referer,
    };

    return true;
  }
}
