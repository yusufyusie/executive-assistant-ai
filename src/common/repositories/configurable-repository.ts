/**
 * Generic Configurable Repository Pattern
 * Enterprise-grade repository with full configurability
 */

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Repository configuration interface
 */
export interface RepositoryConfiguration {
  enabled: boolean;
  type: 'memory' | 'database' | 'cache' | 'hybrid';
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  persistence: {
    enabled: boolean;
    autoSave: boolean;
    saveInterval: number;
  };
  validation: {
    enabled: boolean;
    strict: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableLogging: boolean;
  };
}

/**
 * Generic entity interface
 */
export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query options interface
 */
export interface QueryOptions<T = any> {
  filter?: Partial<T>;
  sort?: Record<keyof T, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  include?: string[];
}

/**
 * Repository result interface
 */
export interface RepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    cached?: boolean;
  };
}

/**
 * Generic repository interface
 */
export interface ConfigurableRepository<T extends Entity> {
  readonly configuration: RepositoryConfiguration;
  
  // CRUD Operations
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<RepositoryResult<T>>;
  findById(id: string): Promise<RepositoryResult<T>>;
  findOne(filter: Partial<T>): Promise<RepositoryResult<T>>;
  findMany(options?: QueryOptions<T>): Promise<RepositoryResult<T[]>>;
  update(id: string, updates: Partial<T>): Promise<RepositoryResult<T>>;
  delete(id: string): Promise<RepositoryResult<boolean>>;
  
  // Bulk Operations
  createMany(entities: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<RepositoryResult<T[]>>;
  updateMany(filter: Partial<T>, updates: Partial<T>): Promise<RepositoryResult<number>>;
  deleteMany(filter: Partial<T>): Promise<RepositoryResult<number>>;
  
  // Utility Operations
  count(filter?: Partial<T>): Promise<RepositoryResult<number>>;
  exists(filter: Partial<T>): Promise<RepositoryResult<boolean>>;
  clear(): Promise<RepositoryResult<boolean>>;
  
  // Configuration Operations
  configure(config: Partial<RepositoryConfiguration>): Promise<void>;
  getHealth(): Promise<RepositoryHealth>;
  getMetrics(): Promise<RepositoryMetrics>;
}

/**
 * Repository health interface
 */
export interface RepositoryHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  connections: {
    primary: boolean;
    cache?: boolean;
    backup?: boolean;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
  };
}

/**
 * Repository metrics interface
 */
export interface RepositoryMetrics {
  operations: {
    total: number;
    successful: number;
    failed: number;
  };
  performance: {
    averageResponseTime: number;
    slowestOperation: number;
    fastestOperation: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  storage: {
    totalEntities: number;
    memoryUsage: number;
    diskUsage?: number;
  };
}

/**
 * Abstract base repository implementation
 */
export abstract class BaseConfigurableRepository<T extends Entity>
  implements ConfigurableRepository<T>
{
  protected readonly logger: Logger;
  protected _configuration: RepositoryConfiguration;
  protected cache = new Map<string, { data: T; timestamp: number }>();
  protected metrics: RepositoryMetrics;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly entityName: string,
    defaultConfig?: Partial<RepositoryConfiguration>,
  ) {
    this.logger = new Logger(`${entityName}Repository`);
    this._configuration = this.loadConfiguration(defaultConfig);
    this.metrics = this.initializeMetrics();
  }

  get configuration(): RepositoryConfiguration {
    return this._configuration;
  }

  // Abstract methods to be implemented by concrete repositories
  abstract create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<RepositoryResult<T>>;
  abstract findById(id: string): Promise<RepositoryResult<T>>;
  abstract findOne(filter: Partial<T>): Promise<RepositoryResult<T>>;
  abstract findMany(options?: QueryOptions<T>): Promise<RepositoryResult<T[]>>;
  abstract update(id: string, updates: Partial<T>): Promise<RepositoryResult<T>>;
  abstract delete(id: string): Promise<RepositoryResult<boolean>>;

  // Default implementations for bulk operations
  async createMany(entities: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<RepositoryResult<T[]>> {
    const results: T[] = [];
    let errors = 0;

    for (const entity of entities) {
      const result = await this.create(entity);
      if (result.success && result.data) {
        results.push(result.data);
      } else {
        errors++;
      }
    }

    return {
      success: errors === 0,
      data: results,
      error: errors > 0 ? `${errors} entities failed to create` : undefined,
      metadata: { total: entities.length },
    };
  }

  async updateMany(filter: Partial<T>, updates: Partial<T>): Promise<RepositoryResult<number>> {
    const findResult = await this.findMany({ filter });
    if (!findResult.success || !findResult.data) {
      return { success: false, error: 'Failed to find entities to update' };
    }

    let updated = 0;
    for (const entity of findResult.data) {
      const result = await this.update(entity.id, updates);
      if (result.success) {
        updated++;
      }
    }

    return {
      success: true,
      data: updated,
      metadata: { total: findResult.data.length },
    };
  }

  async deleteMany(filter: Partial<T>): Promise<RepositoryResult<number>> {
    const findResult = await this.findMany({ filter });
    if (!findResult.success || !findResult.data) {
      return { success: false, error: 'Failed to find entities to delete' };
    }

    let deleted = 0;
    for (const entity of findResult.data) {
      const result = await this.delete(entity.id);
      if (result.success) {
        deleted++;
      }
    }

    return {
      success: true,
      data: deleted,
      metadata: { total: findResult.data.length },
    };
  }

  async count(filter?: Partial<T>): Promise<RepositoryResult<number>> {
    const result = await this.findMany({ filter });
    return {
      success: result.success,
      data: result.data?.length || 0,
      error: result.error,
    };
  }

  async exists(filter: Partial<T>): Promise<RepositoryResult<boolean>> {
    const result = await this.findOne(filter);
    return {
      success: true,
      data: result.success && !!result.data,
    };
  }

  abstract clear(): Promise<RepositoryResult<boolean>>;

  async configure(config: Partial<RepositoryConfiguration>): Promise<void> {
    this._configuration = { ...this._configuration, ...config };
    this.logger.log(`Repository configuration updated for ${this.entityName}`);
  }

  async getHealth(): Promise<RepositoryHealth> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connections: {
        primary: true,
        cache: this._configuration.caching.enabled,
      },
      performance: {
        averageResponseTime: this.metrics.performance.averageResponseTime,
        errorRate: this.metrics.operations.failed / this.metrics.operations.total || 0,
      },
    };
  }

  async getMetrics(): Promise<RepositoryMetrics> {
    return {
      ...this.metrics,
      cache: {
        ...this.metrics.cache,
        hitRate: this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses) || 0,
      },
    };
  }

  // Protected utility methods
  protected generateId(): string {
    return `${this.entityName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected addTimestamps<K>(entity: K): K & { id: string; createdAt: Date; updatedAt: Date } {
    const now = new Date();
    return {
      ...entity,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as K & { id: string; createdAt: Date; updatedAt: Date };
  }

  protected updateTimestamp<K extends { updatedAt: Date }>(entity: K): K {
    return {
      ...entity,
      updatedAt: new Date(),
    };
  }

  protected updateMetrics(operation: string, responseTime: number, success: boolean): void {
    this.metrics.operations.total++;
    if (success) {
      this.metrics.operations.successful++;
    } else {
      this.metrics.operations.failed++;
    }

    this.metrics.performance.averageResponseTime = 
      (this.metrics.performance.averageResponseTime + responseTime) / 2;
    
    if (responseTime > this.metrics.performance.slowestOperation) {
      this.metrics.performance.slowestOperation = responseTime;
    }
    
    if (responseTime < this.metrics.performance.fastestOperation || this.metrics.performance.fastestOperation === 0) {
      this.metrics.performance.fastestOperation = responseTime;
    }
  }

  private loadConfiguration(defaultConfig?: Partial<RepositoryConfiguration>): RepositoryConfiguration {
    const configKey = `repository.${this.entityName.toLowerCase()}`;
    
    return {
      enabled: this.configService.get<boolean>(`${configKey}.enabled`, true),
      type: this.configService.get<string>(`${configKey}.type`, 'memory') as any,
      caching: {
        enabled: this.configService.get<boolean>(`${configKey}.caching.enabled`, true),
        ttl: this.configService.get<number>(`${configKey}.caching.ttl`, 300000),
        maxSize: this.configService.get<number>(`${configKey}.caching.maxSize`, 1000),
      },
      persistence: {
        enabled: this.configService.get<boolean>(`${configKey}.persistence.enabled`, false),
        autoSave: this.configService.get<boolean>(`${configKey}.persistence.autoSave`, true),
        saveInterval: this.configService.get<number>(`${configKey}.persistence.saveInterval`, 60000),
      },
      validation: {
        enabled: this.configService.get<boolean>(`${configKey}.validation.enabled`, true),
        strict: this.configService.get<boolean>(`${configKey}.validation.strict`, false),
      },
      monitoring: {
        enableMetrics: this.configService.get<boolean>(`${configKey}.monitoring.enableMetrics`, true),
        enableLogging: this.configService.get<boolean>(`${configKey}.monitoring.enableLogging`, true),
      },
      ...defaultConfig,
    };
  }

  private initializeMetrics(): RepositoryMetrics {
    return {
      operations: { total: 0, successful: 0, failed: 0 },
      performance: { averageResponseTime: 0, slowestOperation: 0, fastestOperation: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0 },
      storage: { totalEntities: 0, memoryUsage: 0 },
    };
  }
}
