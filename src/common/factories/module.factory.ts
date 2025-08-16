/**
 * Configuration-Driven Module Factory
 * Enterprise-grade dynamic module creation and configuration
 */

import { DynamicModule, Type, Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceFactory } from './service.factory';
import { DynamicConfigurationManager } from '../configuration/dynamic-config.manager';

/**
 * Module configuration interface
 */
export interface ModuleConfiguration {
  name: string;
  enabled: boolean;
  version: string;
  dependencies: string[];
  providers: ProviderConfiguration[];
  controllers: ControllerConfiguration[];
  exports: string[];
  imports: string[];
  metadata: {
    description: string;
    author: string;
    tags: string[];
  };
}

/**
 * Provider configuration interface
 */
export interface ProviderConfiguration {
  name: string;
  type: 'service' | 'repository' | 'factory' | 'value' | 'class';
  implementation?: string;
  useClass?: Type<any>;
  useValue?: any;
  useFactory?: {
    factory: (...args: any[]) => any;
    inject: string[];
  };
  scope?: 'singleton' | 'request' | 'transient';
  configuration?: Record<string, any>;
}

/**
 * Controller configuration interface
 */
export interface ControllerConfiguration {
  name: string;
  path: string;
  enabled: boolean;
  middleware: string[];
  guards: string[];
  interceptors: string[];
  filters: string[];
}

/**
 * Module registry for tracking created modules
 */
export interface ModuleRegistry {
  name: string;
  module: DynamicModule;
  configuration: ModuleConfiguration;
  createdAt: Date;
  status: 'active' | 'inactive' | 'error';
}

/**
 * Configuration-driven module factory
 */
export class ConfigurableModuleFactory {
  private static readonly logger = new Logger(ConfigurableModuleFactory.name);
  private static readonly moduleRegistry = new Map<string, ModuleRegistry>();
  private static readonly providerRegistry = new Map<string, Type<any>>();
  private static readonly controllerRegistry = new Map<string, Type<any>>();

  /**
   * Register provider class for dynamic instantiation
   */
  static registerProvider(name: string, providerClass: Type<any>): void {
    this.providerRegistry.set(name, providerClass);
    this.logger.debug(`Provider registered: ${name}`);
  }

  /**
   * Register controller class for dynamic instantiation
   */
  static registerController(name: string, controllerClass: Type<any>): void {
    this.controllerRegistry.set(name, controllerClass);
    this.logger.debug(`Controller registered: ${name}`);
  }

  /**
   * Create dynamic module from configuration
   */
  static async createModule(
    config: ModuleConfiguration,
    configService: ConfigService,
  ): Promise<DynamicModule> {
    try {
      this.logger.log(`Creating dynamic module: ${config.name}`);

      // Check if module is enabled
      if (!config.enabled) {
        this.logger.warn(`Module ${config.name} is disabled, skipping creation`);
        return this.createEmptyModule(config.name);
      }

      // Validate dependencies
      await this.validateDependencies(config.dependencies);

      // Create providers
      const providers = await this.createProviders(config.providers, configService);

      // Create controllers
      const controllers = this.createControllers(config.controllers);

      // Create imports
      const imports = this.resolveImports(config.imports);

      // Create exports
      const exports = this.resolveExports(config.exports, providers);

      const dynamicModule: DynamicModule = {
        module: class DynamicConfigurableModule {},
        providers,
        controllers,
        imports,
        exports,
        global: false,
      };

      // Register module
      this.registerModule(config, dynamicModule);

      this.logger.log(`Dynamic module created successfully: ${config.name}`);
      return dynamicModule;
    } catch (error) {
      this.logger.error(`Failed to create module ${config.name}:`, error.stack);
      throw error;
    }
  }

  /**
   * Create multiple modules from configuration array
   */
  static async createModules(
    configurations: ModuleConfiguration[],
    configService: ConfigService,
  ): Promise<DynamicModule[]> {
    const modules: DynamicModule[] = [];

    // Sort by dependencies to ensure proper loading order
    const sortedConfigs = this.sortByDependencies(configurations);

    for (const config of sortedConfigs) {
      try {
        const module = await this.createModule(config, configService);
        modules.push(module);
      } catch (error) {
        this.logger.error(`Failed to create module ${config.name}, skipping:`, error.stack);
      }
    }

    return modules;
  }

  /**
   * Get module registry information
   */
  static getModuleRegistry(): Map<string, ModuleRegistry> {
    return new Map(this.moduleRegistry);
  }

  /**
   * Get module by name
   */
  static getModule(name: string): ModuleRegistry | undefined {
    return this.moduleRegistry.get(name);
  }

  /**
   * Update module configuration at runtime
   */
  static async updateModuleConfiguration(
    moduleName: string,
    newConfig: Partial<ModuleConfiguration>,
    configService: ConfigService,
  ): Promise<boolean> {
    try {
      const existingModule = this.moduleRegistry.get(moduleName);
      if (!existingModule) {
        this.logger.warn(`Module ${moduleName} not found for update`);
        return false;
      }

      const updatedConfig = { ...existingModule.configuration, ...newConfig };
      const newModule = await this.createModule(updatedConfig, configService);

      // Update registry
      this.moduleRegistry.set(moduleName, {
        ...existingModule,
        module: newModule,
        configuration: updatedConfig,
      });

      this.logger.log(`Module ${moduleName} configuration updated successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update module ${moduleName}:`, error.stack);
      return false;
    }
  }

  /**
   * Create providers from configuration
   */
  private static async createProviders(
    providerConfigs: ProviderConfiguration[],
    configService: ConfigService,
  ): Promise<Provider[]> {
    const providers: Provider[] = [];

    for (const config of providerConfigs) {
      try {
        const provider = await this.createProvider(config, configService);
        if (provider) {
          providers.push(provider);
        }
      } catch (error) {
        this.logger.error(`Failed to create provider ${config.name}:`, error.stack);
      }
    }

    return providers;
  }

  /**
   * Create single provider from configuration
   */
  private static async createProvider(
    config: ProviderConfiguration,
    configService: ConfigService,
  ): Promise<Provider | null> {
    switch (config.type) {
      case 'class':
        if (config.useClass) {
          return {
            provide: config.name,
            useClass: config.useClass,
            scope: config.scope as any,
          };
        }
        break;

      case 'value':
        return {
          provide: config.name,
          useValue: config.useValue,
        };

      case 'factory':
        if (config.useFactory) {
          return {
            provide: config.name,
            useFactory: config.useFactory.factory,
            inject: config.useFactory.inject,
            scope: config.scope as any,
          };
        }
        break;

      case 'service': {
        const ServiceClass = this.providerRegistry.get(config.implementation || config.name);
        if (ServiceClass) {
          return {
            provide: config.name,
            useClass: ServiceClass,
            scope: config.scope as any,
          };
        }
        break;
      }

      case 'repository': {
        const RepositoryClass = this.providerRegistry.get(config.implementation || config.name);
        if (RepositoryClass) {
          return {
            provide: config.name,
            useClass: RepositoryClass,
            scope: config.scope as any,
          };
        }
        break;
      }

      default:
        this.logger.warn(`Unknown provider type: ${config.type}`);
    }

    return null;
  }

  /**
   * Create controllers from configuration
   */
  private static createControllers(controllerConfigs: ControllerConfiguration[]): Type<any>[] {
    const controllers: Type<any>[] = [];

    for (const config of controllerConfigs) {
      if (!config.enabled) {
        this.logger.debug(`Controller ${config.name} is disabled, skipping`);
        continue;
      }

      const ControllerClass = this.controllerRegistry.get(config.name);
      if (ControllerClass) {
        controllers.push(ControllerClass);
      } else {
        this.logger.warn(`Controller class not found: ${config.name}`);
      }
    }

    return controllers;
  }

  /**
   * Resolve module imports
   */
  private static resolveImports(importNames: string[]): any[] {
    const imports: any[] = [];

    for (const importName of importNames) {
      const moduleRegistry = this.moduleRegistry.get(importName);
      if (moduleRegistry) {
        imports.push(moduleRegistry.module);
      } else {
        this.logger.warn(`Import module not found: ${importName}`);
      }
    }

    return imports;
  }

  /**
   * Resolve module exports
   */
  private static resolveExports(exportNames: string[], providers: Provider[]): any[] {
    const exports: any[] = [];

    for (const exportName of exportNames) {
      const provider = providers.find(p => 
        (typeof p === 'object' && 'provide' in p && p.provide === exportName)
      );
      
      if (provider) {
        exports.push(exportName);
      } else {
        this.logger.warn(`Export provider not found: ${exportName}`);
      }
    }

    return exports;
  }

  /**
   * Validate module dependencies
   */
  private static async validateDependencies(dependencies: string[]): Promise<void> {
    for (const dependency of dependencies) {
      if (!this.moduleRegistry.has(dependency)) {
        throw new Error(`Dependency module not found: ${dependency}`);
      }
    }
  }

  /**
   * Sort modules by dependencies
   */
  private static sortByDependencies(configurations: ModuleConfiguration[]): ModuleConfiguration[] {
    const sorted: ModuleConfiguration[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (config: ModuleConfiguration) => {
      if (visiting.has(config.name)) {
        throw new Error(`Circular dependency detected: ${config.name}`);
      }
      
      if (visited.has(config.name)) {
        return;
      }

      visiting.add(config.name);

      // Visit dependencies first
      for (const depName of config.dependencies) {
        const depConfig = configurations.find(c => c.name === depName);
        if (depConfig) {
          visit(depConfig);
        }
      }

      visiting.delete(config.name);
      visited.add(config.name);
      sorted.push(config);
    };

    for (const config of configurations) {
      visit(config);
    }

    return sorted;
  }

  /**
   * Create empty module for disabled modules
   */
  private static createEmptyModule(name: string): DynamicModule {
    return {
      module: class EmptyModule {},
      providers: [],
      controllers: [],
      imports: [],
      exports: [],
    };
  }

  /**
   * Register created module
   */
  private static registerModule(config: ModuleConfiguration, module: DynamicModule): void {
    this.moduleRegistry.set(config.name, {
      name: config.name,
      module,
      configuration: config,
      createdAt: new Date(),
      status: 'active',
    });
  }

  /**
   * Get module statistics
   */
  static getStatistics(): {
    totalModules: number;
    activeModules: number;
    registeredProviders: number;
    registeredControllers: number;
    averageProvidersPerModule: number;
  } {
    const modules = Array.from(this.moduleRegistry.values());
    const activeModules = modules.filter(m => m.status === 'active');
    
    return {
      totalModules: modules.length,
      activeModules: activeModules.length,
      registeredProviders: this.providerRegistry.size,
      registeredControllers: this.controllerRegistry.size,
      averageProvidersPerModule: modules.length > 0 
        ? modules.reduce((sum, m) => sum + (m.module.providers?.length || 0), 0) / modules.length 
        : 0,
    };
  }
}
