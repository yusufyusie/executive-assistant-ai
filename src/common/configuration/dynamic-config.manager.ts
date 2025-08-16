/**
 * Dynamic Configuration Manager
 * Enterprise-grade runtime configuration management
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Note: EventEmitter2 would be imported if @nestjs/event-emitter is installed
// For now, using a simple EventEmitter implementation

/**
 * Configuration change event
 */
export interface ConfigurationChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  source: 'environment' | 'runtime' | 'external';
}

/**
 * Configuration validation rule
 */
export interface ValidationRule<T = any> {
  key: string;
  validator: (value: T) => boolean | Promise<boolean>;
  errorMessage: string;
  required?: boolean;
  defaultValue?: T;
}

/**
 * Configuration schema definition
 */
export interface ConfigurationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    defaultValue?: any;
    validation?: ValidationRule[];
    description?: string;
    sensitive?: boolean;
  };
}

/**
 * Configuration profile for different environments
 */
export interface ConfigurationProfile {
  name: string;
  environment: string;
  configurations: Record<string, any>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    author?: string;
  };
}

/**
 * Dynamic configuration manager
 */
@Injectable()
export class DynamicConfigurationManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DynamicConfigurationManager.name);
  private readonly configurations = new Map<string, any>();
  private readonly validationRules = new Map<string, ValidationRule[]>();
  private readonly watchers = new Map<string, any>();
  private readonly schemas = new Map<string, ConfigurationSchema>();
  private readonly profiles = new Map<string, ConfigurationProfile>();
  
  private isInitialized = false;
  private currentProfile: string = 'default';

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }

  /**
   * Initialize the configuration manager
   */
  async initialize(): Promise<void> {
    try {
      this.logger.log('Initializing Dynamic Configuration Manager');
      
      // Load initial configurations
      await this.loadInitialConfigurations();
      
      // Register default schemas
      this.registerDefaultSchemas();
      
      // Start configuration watchers
      this.startConfigurationWatchers();
      
      this.isInitialized = true;
      this.logger.log('Dynamic Configuration Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Dynamic Configuration Manager', error.stack);
      throw error;
    }
  }

  /**
   * Shutdown the configuration manager
   */
  async shutdown(): Promise<void> {
    this.logger.log('Shutting down Dynamic Configuration Manager');
    
    // Clear all watchers
    for (const watcher of this.watchers.values()) {
      clearInterval(watcher);
    }
    this.watchers.clear();
    
    this.isInitialized = false;
    this.logger.log('Dynamic Configuration Manager shutdown completed');
  }

  /**
   * Get configuration value with type safety
   */
  get<T = any>(key: string, defaultValue?: T): T {
    const value = this.configurations.get(key);
    if (value !== undefined) {
      return value as T;
    }
    
    // Fallback to ConfigService
    const envValue = this.configService.get(key);
    if (envValue !== undefined) {
      this.configurations.set(key, envValue);
      return envValue as T;
    }
    
    return defaultValue as T;
  }

  /**
   * Set configuration value with validation
   */
  async set<T = any>(key: string, value: T, source: 'runtime' | 'external' = 'runtime'): Promise<boolean> {
    try {
      // Validate the new value
      const isValid = await this.validateValue(key, value);
      if (!isValid) {
        this.logger.warn(`Invalid configuration value for key: ${key}`);
        return false;
      }

      const oldValue = this.configurations.get(key);
      this.configurations.set(key, value);

      // Emit change event
      const changeEvent: ConfigurationChangeEvent = {
        key,
        oldValue,
        newValue: value,
        timestamp: new Date(),
        source,
      };

      // Emit change event (would use EventEmitter2 in full implementation)
      this.logger.debug('Configuration changed:', changeEvent);
      this.logger.debug(`Configuration updated: ${key} = ${this.isSensitive(key) ? '[REDACTED]' : value}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to set configuration ${key}:`, error.stack);
      return false;
    }
  }

  /**
   * Register configuration schema
   */
  registerSchema(name: string, schema: ConfigurationSchema): void {
    this.schemas.set(name, schema);
    this.logger.debug(`Configuration schema registered: ${name}`);
  }

  /**
   * Register validation rule
   */
  registerValidationRule(rule: ValidationRule): void {
    const rules = this.validationRules.get(rule.key) || [];
    rules.push(rule);
    this.validationRules.set(rule.key, rules);
    this.logger.debug(`Validation rule registered for: ${rule.key}`);
  }

  /**
   * Create configuration profile
   */
  async createProfile(profile: Omit<ConfigurationProfile, 'metadata'>): Promise<boolean> {
    try {
      const fullProfile: ConfigurationProfile = {
        ...profile,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };

      this.profiles.set(profile.name, fullProfile);
      this.logger.log(`Configuration profile created: ${profile.name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to create profile ${profile.name}:`, error.stack);
      return false;
    }
  }

  /**
   * Switch to configuration profile
   */
  async switchProfile(profileName: string): Promise<boolean> {
    try {
      const profile = this.profiles.get(profileName);
      if (!profile) {
        this.logger.warn(`Configuration profile not found: ${profileName}`);
        return false;
      }

      // Apply profile configurations
      for (const [key, value] of Object.entries(profile.configurations)) {
        await this.set(key, value, 'external');
      }

      this.currentProfile = profileName;
      this.logger.log(`Switched to configuration profile: ${profileName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to switch to profile ${profileName}:`, error.stack);
      return false;
    }
  }

  /**
   * Get all configurations
   */
  getAllConfigurations(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of this.configurations.entries()) {
      result[key] = this.isSensitive(key) ? '[REDACTED]' : value;
    }
    
    return result;
  }

  /**
   * Get configuration metadata
   */
  getMetadata(): {
    totalConfigurations: number;
    currentProfile: string;
    availableProfiles: string[];
    schemas: string[];
    validationRules: number;
    isInitialized: boolean;
  } {
    return {
      totalConfigurations: this.configurations.size,
      currentProfile: this.currentProfile,
      availableProfiles: Array.from(this.profiles.keys()),
      schemas: Array.from(this.schemas.keys()),
      validationRules: Array.from(this.validationRules.values()).reduce((sum, rules) => sum + rules.length, 0),
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Watch configuration changes
   */
  watch(key: string, callback: (value: any) => void): () => void {
    // Simple implementation - in full version would use EventEmitter2
    const watchers = new Set<(value: any) => void>();
    watchers.add(callback);

    // Return unsubscribe function
    return () => {
      watchers.delete(callback);
    };
  }

  /**
   * Validate configuration value
   */
  private async validateValue(key: string, value: any): Promise<boolean> {
    const rules = this.validationRules.get(key);
    if (!rules || rules.length === 0) {
      return true;
    }

    for (const rule of rules) {
      try {
        const isValid = await rule.validator(value);
        if (!isValid) {
          this.logger.warn(`Validation failed for ${key}: ${rule.errorMessage}`);
          return false;
        }
      } catch (error) {
        this.logger.error(`Validation error for ${key}:`, error.stack);
        return false;
      }
    }

    return true;
  }

  /**
   * Check if configuration key is sensitive
   */
  private isSensitive(key: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /credential/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  /**
   * Load initial configurations from environment
   */
  private async loadInitialConfigurations(): Promise<void> {
    // Load from environment variables
    const envVars = process.env;
    for (const [key, value] of Object.entries(envVars)) {
      if (value !== undefined) {
        this.configurations.set(key, this.parseValue(value));
      }
    }

    this.logger.debug(`Loaded ${this.configurations.size} initial configurations`);
  }

  /**
   * Parse string value to appropriate type
   */
  private parseValue(value: string): any {
    // Boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }
    
    // JSON
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch {
        // Fall through to string
      }
    }
    
    return value;
  }

  /**
   * Register default configuration schemas
   */
  private registerDefaultSchemas(): void {
    // Application schema
    this.registerSchema('application', {
      'app.name': { type: 'string', required: true, defaultValue: 'Executive Assistant AI' },
      'app.version': { type: 'string', required: true, defaultValue: '2.0.0' },
      'app.environment': { type: 'string', required: true, defaultValue: 'development' },
      'app.port': { type: 'number', required: true, defaultValue: 3000 },
    });

    // AI Services schema
    this.registerSchema('ai', {
      'ai.gemini.apiKey': { type: 'string', required: true, sensitive: true },
      'ai.gemini.model': { type: 'string', defaultValue: 'gemini-2.0-flash-exp' },
      'ai.gemini.temperature': { type: 'number', defaultValue: 0.7 },
      'ai.gemini.maxTokens': { type: 'number', defaultValue: 1000 },
    });

    this.logger.debug('Default configuration schemas registered');
  }

  /**
   * Start configuration watchers for external changes
   */
  private startConfigurationWatchers(): void {
    // Watch for environment variable changes (if supported)
    const watchInterval = this.configService.get<number>('config.watchInterval', 30000);
    
    if (watchInterval > 0) {
      const watcher = setInterval(() => {
        this.checkForExternalChanges();
      }, watchInterval);
      
      this.watchers.set('environment', watcher);
      this.logger.debug(`Configuration watcher started with interval: ${watchInterval}ms`);
    }
  }

  /**
   * Check for external configuration changes
   */
  private async checkForExternalChanges(): Promise<void> {
    // This would typically check external configuration sources
    // For now, it's a placeholder for future implementation
    this.logger.debug('Checking for external configuration changes');
  }
}
