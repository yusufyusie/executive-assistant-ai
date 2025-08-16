/**
 * Configurable Service Examples
 * Demonstrates enterprise-grade configurable patterns
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseConfigurableService, ServiceConfiguration, ServiceStatus } from '../factories/service.factory';

/**
 * Example: Configurable Email Service
 */
interface EmailServiceConfiguration extends ServiceConfiguration {
  provider: 'sendgrid' | 'mailgun' | 'ses';
  apiKey: string;
  fromEmail: string;
  fromName: string;
  templates: {
    enabled: boolean;
    defaultTemplate: string;
  };
  tracking: {
    enabled: boolean;
    clickTracking: boolean;
    openTracking: boolean;
  };
  rateLimit: {
    maxEmailsPerHour: number;
    maxEmailsPerDay: number;
  };
}

@Injectable()
export class ConfigurableEmailService extends BaseConfigurableService<EmailServiceConfiguration> {
  constructor(configService: ConfigService) {
    super(configService, 'ConfigurableEmailService');
  }

  async initialize(config: EmailServiceConfiguration): Promise<void> {
    this._configuration = config;
    
    if (!config.apiKey) {
      this._status = ServiceStatus.ERROR;
      throw new Error('Email service API key is required');
    }
    
    this._status = ServiceStatus.READY;
    this.logger.log(`Email service initialized with provider: ${config.provider}`);
  }

  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Validate rate limits
      if (!this.checkRateLimit()) {
        this.logger.warn('Rate limit exceeded for email sending');
        return false;
      }

      // Mock email sending based on provider
      const result = await this.sendEmailByProvider(to, subject, content);
      
      this.updateMetrics(Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, true);
      this.logger.error('Failed to send email:', error.stack);
      return false;
    }
  }

  async sendTemplateEmail(to: string, templateId: string, variables: Record<string, any>): Promise<boolean> {
    if (!this.configuration.templates.enabled) {
      this.logger.warn('Template emails are disabled');
      return false;
    }

    // Mock template email sending
    this.logger.log(`Sending template email: ${templateId} to ${to}`);
    return true;
  }

  protected async checkDependencies(): Promise<Record<string, boolean>> {
    return {
      apiKey: !!this.configuration.apiKey,
      provider: ['sendgrid', 'mailgun', 'ses'].includes(this.configuration.provider),
      network: true, // Would check actual network connectivity
    };
  }

  private async sendEmailByProvider(to: string, subject: string, content: string): Promise<boolean> {
    switch (this.configuration.provider) {
      case 'sendgrid':
        return this.sendViaSendGrid(to, subject, content);
      case 'mailgun':
        return this.sendViaMailgun(to, subject, content);
      case 'ses':
        return this.sendViaSES(to, subject, content);
      default:
        throw new Error(`Unknown email provider: ${this.configuration.provider}`);
    }
  }

  private async sendViaSendGrid(to: string, subject: string, content: string): Promise<boolean> {
    this.logger.debug(`Sending email via SendGrid to ${to}`);
    // Mock implementation
    return true;
  }

  private async sendViaMailgun(to: string, subject: string, content: string): Promise<boolean> {
    this.logger.debug(`Sending email via Mailgun to ${to}`);
    // Mock implementation
    return true;
  }

  private async sendViaSES(to: string, subject: string, content: string): Promise<boolean> {
    this.logger.debug(`Sending email via AWS SES to ${to}`);
    // Mock implementation
    return true;
  }

  private checkRateLimit(): boolean {
    // Mock rate limit check
    return true;
  }
}

/**
 * Example: Configurable Cache Service
 */
interface CacheServiceConfiguration extends ServiceConfiguration {
  provider: 'memory' | 'redis' | 'memcached';
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  defaultTTL: number;
  maxMemoryUsage: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'lz4' | 'snappy';
  };
}

@Injectable()
export class ConfigurableCacheService extends BaseConfigurableService<CacheServiceConfiguration> {
  private cache = new Map<string, { value: any; expiry: number }>();

  constructor(configService: ConfigService) {
    super(configService, 'ConfigurableCacheService');
  }

  async initialize(config: CacheServiceConfiguration): Promise<void> {
    this._configuration = config;
    
    if (config.provider === 'redis' && !config.host) {
      this._status = ServiceStatus.ERROR;
      throw new Error('Redis host is required when using Redis provider');
    }
    
    this._status = ServiceStatus.READY;
    this.logger.log(`Cache service initialized with provider: ${config.provider}`);
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const result = await this.getByProvider<T>(key);
      this.updateMetrics(Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, true);
      this.logger.error(`Failed to get cache key ${key}:`, error.stack);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const result = await this.setByProvider(key, value, ttl);
      this.updateMetrics(Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, true);
      this.logger.error(`Failed to set cache key ${key}:`, error.stack);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const result = await this.deleteByProvider(key);
      this.updateMetrics(Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, true);
      this.logger.error(`Failed to delete cache key ${key}:`, error.stack);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.clearByProvider();
      this.logger.log('Cache cleared successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to clear cache:', error.stack);
      return false;
    }
  }

  protected async checkDependencies(): Promise<Record<string, boolean>> {
    return {
      provider: ['memory', 'redis', 'memcached'].includes(this.configuration.provider),
      connection: this.configuration.provider === 'memory' ? true : await this.checkConnection(),
      memoryUsage: this.getMemoryUsage() < this.configuration.maxMemoryUsage,
    };
  }

  private async getByProvider<T>(key: string): Promise<T | null> {
    switch (this.configuration.provider) {
      case 'memory':
        return this.getFromMemory<T>(key);
      case 'redis':
        return this.getFromRedis<T>(key);
      case 'memcached':
        return this.getFromMemcached<T>(key);
      default:
        throw new Error(`Unknown cache provider: ${this.configuration.provider}`);
    }
  }

  private async setByProvider<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    switch (this.configuration.provider) {
      case 'memory':
        return this.setInMemory(key, value, ttl);
      case 'redis':
        return this.setInRedis(key, value, ttl);
      case 'memcached':
        return this.setInMemcached(key, value, ttl);
      default:
        throw new Error(`Unknown cache provider: ${this.configuration.provider}`);
    }
  }

  private async deleteByProvider(key: string): Promise<boolean> {
    switch (this.configuration.provider) {
      case 'memory':
        return this.deleteFromMemory(key);
      case 'redis':
        return this.deleteFromRedis(key);
      case 'memcached':
        return this.deleteFromMemcached(key);
      default:
        throw new Error(`Unknown cache provider: ${this.configuration.provider}`);
    }
  }

  private async clearByProvider(): Promise<void> {
    switch (this.configuration.provider) {
      case 'memory':
        this.cache.clear();
        break;
      case 'redis':
        // Would clear Redis cache
        break;
      case 'memcached':
        // Would clear Memcached cache
        break;
    }
  }

  // Memory cache implementations
  private getFromMemory<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  private setInMemory<T>(key: string, value: T, ttl?: number): boolean {
    const expiry = Date.now() + (ttl || this.configuration.defaultTTL);
    this.cache.set(key, { value, expiry });
    return true;
  }

  private deleteFromMemory(key: string): boolean {
    return this.cache.delete(key);
  }

  // Redis implementations (mock)
  private async getFromRedis<T>(key: string): Promise<T | null> {
    this.logger.debug(`Getting from Redis: ${key}`);
    return null; // Mock implementation
  }

  private async setInRedis<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    this.logger.debug(`Setting in Redis: ${key}`);
    return true; // Mock implementation
  }

  private async deleteFromRedis(key: string): Promise<boolean> {
    this.logger.debug(`Deleting from Redis: ${key}`);
    return true; // Mock implementation
  }

  // Memcached implementations (mock)
  private async getFromMemcached<T>(key: string): Promise<T | null> {
    this.logger.debug(`Getting from Memcached: ${key}`);
    return null; // Mock implementation
  }

  private async setInMemcached<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    this.logger.debug(`Setting in Memcached: ${key}`);
    return true; // Mock implementation
  }

  private async deleteFromMemcached(key: string): Promise<boolean> {
    this.logger.debug(`Deleting from Memcached: ${key}`);
    return true; // Mock implementation
  }

  private async checkConnection(): Promise<boolean> {
    // Mock connection check
    return true;
  }

  private getMemoryUsage(): number {
    // Mock memory usage calculation
    return process.memoryUsage().heapUsed;
  }
}

/**
 * Example usage of configurable services
 */
export class ConfigurableServiceExamples {
  static async demonstrateEmailService(configService: ConfigService): Promise<void> {
    const emailConfig: EmailServiceConfiguration = {
      enabled: true,
      name: 'EmailService',
      provider: 'sendgrid',
      apiKey: 'your-api-key',
      fromEmail: 'noreply@example.com',
      fromName: 'Executive Assistant AI',
      templates: { enabled: true, defaultTemplate: 'default' },
      tracking: { enabled: true, clickTracking: true, openTracking: true },
      rateLimit: { maxEmailsPerHour: 100, maxEmailsPerDay: 1000 },
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimiting: { maxRequests: 100, windowMs: 60000 },
      monitoring: { enableMetrics: true, enableLogging: true, logLevel: 'info' },
    };

    const emailService = new ConfigurableEmailService(configService);
    await emailService.initialize(emailConfig);

    // Send email
    const success = await emailService.sendEmail(
      'user@example.com',
      'Welcome!',
      'Welcome to our service!'
    );

    // Email sent: ${success}
  }

  static async demonstrateCacheService(configService: ConfigService): Promise<void> {
    const cacheConfig: CacheServiceConfiguration = {
      enabled: true,
      name: 'CacheService',
      provider: 'memory',
      defaultTTL: 300000, // 5 minutes
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      evictionPolicy: 'lru',
      compression: { enabled: false, algorithm: 'gzip' },
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 500,
      rateLimiting: { maxRequests: 1000, windowMs: 60000 },
      monitoring: { enableMetrics: true, enableLogging: true, logLevel: 'info' },
    };

    const cacheService = new ConfigurableCacheService(configService);
    await cacheService.initialize(cacheConfig);

    // Use cache
    await cacheService.set('user:123', { name: 'John Doe', email: 'john@example.com' });
    const user = await cacheService.get('user:123');

    // Cached user: ${user}
  }
}
