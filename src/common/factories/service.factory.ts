/**
 * Generic Service Factory - Enterprise Pattern
 * Creates configurable, type-safe service instances
 */

import { Type, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Base configuration interface for all services
 */
export interface ServiceConfiguration {
  enabled: boolean;
  name: string;
  version?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimiting?: {
    maxRequests: number;
    windowMs: number;
  };
  monitoring?: {
    enableMetrics: boolean;
    enableLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  };
}

/**
 * Generic service interface
 */
export interface ConfigurableService<TConfig extends ServiceConfiguration> {
  readonly configuration: TConfig;
  readonly isConfigured: boolean;
  readonly status: ServiceStatus;
  
  initialize(config: TConfig): Promise<void>;
  getHealth(): Promise<HealthStatus>;
  getMetrics(): Promise<ServiceMetrics>;
  shutdown(): Promise<void>;
}

/**
 * Service status enumeration
 */
export enum ServiceStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  DEGRADED = 'degraded',
  ERROR = 'error',
  SHUTDOWN = 'shutdown',
}

/**
 * Health status interface
 */
export interface HealthStatus {
  status: ServiceStatus;
  timestamp: string;
  uptime: number;
  lastCheck: string;
  dependencies: Record<string, boolean>;
  errors?: string[];
}

/**
 * Service metrics interface
 */
export interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastRequestTime: string;
  memoryUsage: any;
}

/**
 * Abstract base class for configurable services
 */
export abstract class BaseConfigurableService<TConfig extends ServiceConfiguration>
  implements ConfigurableService<TConfig>
{
  protected readonly logger: Logger;
  protected _configuration: TConfig;
  protected _status: ServiceStatus = ServiceStatus.INITIALIZING;
  protected _metrics: ServiceMetrics;
  protected startTime: number;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly serviceName: string,
  ) {
    this.logger = new Logger(serviceName);
    this.startTime = Date.now();
    this._metrics = this.initializeMetrics();
  }

  get configuration(): TConfig {
    return this._configuration;
  }

  get isConfigured(): boolean {
    return this._configuration?.enabled === true;
  }

  get status(): ServiceStatus {
    return this._status;
  }

  abstract initialize(config: TConfig): Promise<void>;

  async getHealth(): Promise<HealthStatus> {
    return {
      status: this._status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      lastCheck: new Date().toISOString(),
      dependencies: await this.checkDependencies(),
    };
  }

  async getMetrics(): Promise<ServiceMetrics> {
    return {
      ...this._metrics,
      memoryUsage: process.memoryUsage(),
    };
  }

  async shutdown(): Promise<void> {
    this._status = ServiceStatus.SHUTDOWN;
    this.logger.log(`${this.serviceName} service shutdown completed`);
  }

  protected abstract checkDependencies(): Promise<Record<string, boolean>>;

  protected updateMetrics(responseTime?: number, isError: boolean = false): void {
    this._metrics.requestCount++;
    if (isError) {
      this._metrics.errorCount++;
    }
    if (responseTime) {
      this._metrics.averageResponseTime = 
        (this._metrics.averageResponseTime + responseTime) / 2;
    }
    this._metrics.lastRequestTime = new Date().toISOString();
  }

  private initializeMetrics(): ServiceMetrics {
    return {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastRequestTime: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
    };
  }
}

/**
 * Service factory for creating configurable service instances
 */
@Injectable()
export class ServiceFactory {
  private readonly logger = new Logger(ServiceFactory.name);
  private readonly serviceRegistry = new Map<string, ConfigurableService<any>>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Create a configurable service instance
   */
  async createService<TService extends ConfigurableService<TConfig>, TConfig extends ServiceConfiguration>(
    ServiceClass: Type<TService>,
    configKey: string,
    defaultConfig?: Partial<TConfig>,
  ): Promise<TService> {
    try {
      // Load configuration
      const config = this.loadServiceConfig<TConfig>(configKey, defaultConfig);
      
      // Create service instance
      const service = new ServiceClass(this.configService, configKey);
      
      // Initialize service
      await service.initialize(config);
      
      // Register service
      this.serviceRegistry.set(configKey, service);
      
      this.logger.log(`Service ${configKey} created and initialized successfully`);
      return service;
    } catch (error) {
      this.logger.error(`Failed to create service ${configKey}:`, error.stack);
      throw error;
    }
  }

  /**
   * Get a registered service
   */
  getService<TService extends ConfigurableService<any>>(serviceName: string): TService | undefined {
    return this.serviceRegistry.get(serviceName) as TService;
  }

  /**
   * Get all registered services
   */
  getAllServices(): Map<string, ConfigurableService<any>> {
    return new Map(this.serviceRegistry);
  }

  /**
   * Shutdown all services
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this.serviceRegistry.values()).map(
      service => service.shutdown(),
    );
    
    await Promise.all(shutdownPromises);
    this.serviceRegistry.clear();
    this.logger.log('All services shutdown completed');
  }

  /**
   * Load service configuration with validation
   */
  private loadServiceConfig<TConfig extends ServiceConfiguration>(
    configKey: string,
    defaultConfig?: Partial<TConfig>,
  ): TConfig {
    const config = {
      enabled: this.configService.get<boolean>(`${configKey}.enabled`, true),
      name: configKey,
      version: this.configService.get<string>(`${configKey}.version`, '1.0.0'),
      timeout: this.configService.get<number>(`${configKey}.timeout`, 30000),
      retryAttempts: this.configService.get<number>(`${configKey}.retryAttempts`, 3),
      retryDelay: this.configService.get<number>(`${configKey}.retryDelay`, 1000),
      rateLimiting: {
        maxRequests: this.configService.get<number>(`${configKey}.rateLimiting.maxRequests`, 100),
        windowMs: this.configService.get<number>(`${configKey}.rateLimiting.windowMs`, 60000),
      },
      monitoring: {
        enableMetrics: this.configService.get<boolean>(`${configKey}.monitoring.enableMetrics`, true),
        enableLogging: this.configService.get<boolean>(`${configKey}.monitoring.enableLogging`, true),
        logLevel: this.configService.get<string>(`${configKey}.monitoring.logLevel`, 'info') as any,
      },
      ...defaultConfig,
    } as TConfig;

    this.validateConfiguration(config);
    return config;
  }

  /**
   * Validate service configuration
   */
  private validateConfiguration<TConfig extends ServiceConfiguration>(config: TConfig): void {
    if (!config.name) {
      throw new Error('Service name is required');
    }
    if (config.timeout && config.timeout < 0) {
      throw new Error('Timeout must be positive');
    }
    if (config.retryAttempts && config.retryAttempts < 0) {
      throw new Error('Retry attempts must be positive');
    }
  }
}
