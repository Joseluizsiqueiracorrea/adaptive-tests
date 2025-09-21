/**
 * Dependency Injection Container
 * Implements IoC pattern for better testability and modularity
 */

import * as vscode from 'vscode';
import { createLogger, Logger } from './logger';

type Constructor<T = {}> = new (...args: any[]) => T;
type Factory<T> = (container: Container) => T | Promise<T>;
type Token<T> = Symbol | string | Constructor<T>;

interface ServiceDescriptor<T> {
  token: Token<T>;
  factory?: Factory<T>;
  constructor?: Constructor<T>;
  value?: T;
  singleton: boolean;
  dependencies?: Token<any>[];
  tags?: string[];
}

export class Container {
  private services = new Map<Token<any>, ServiceDescriptor<any>>();
  private singletons = new Map<Token<any>, any>();
  private resolving = new Set<Token<any>>();
  private logger: Logger;

  constructor(private parent?: Container) {
    this.logger = createLogger('container');
  }

  /**
   * Register a singleton service
   */
  singleton<T>(token: Token<T>, factory: Factory<T> | Constructor<T>, deps?: Token<any>[]): this {
    const descriptor: ServiceDescriptor<T> = {
      token,
      singleton: true,
      dependencies: deps,
      tags: []
    };

    if (typeof factory === 'function' && factory.prototype) {
      descriptor.constructor = factory as Constructor<T>;
    } else {
      descriptor.factory = factory as Factory<T>;
    }

    this.services.set(token, descriptor);
    this.logger.debug('Registered singleton', { token: String(token) });
    return this;
  }

  /**
   * Register a transient service (new instance each time)
   */
  transient<T>(token: Token<T>, factory: Factory<T> | Constructor<T>, deps?: Token<any>[]): this {
    const descriptor: ServiceDescriptor<T> = {
      token,
      singleton: false,
      dependencies: deps,
      tags: []
    };

    if (typeof factory === 'function' && factory.prototype) {
      descriptor.constructor = factory as Constructor<T>;
    } else {
      descriptor.factory = factory as Factory<T>;
    }

    this.services.set(token, descriptor);
    this.logger.debug('Registered transient', { token: String(token) });
    return this;
  }

  /**
   * Register a constant value
   */
  value<T>(token: Token<T>, value: T): this {
    this.services.set(token, {
      token,
      value,
      singleton: true,
      tags: []
    });
    this.logger.debug('Registered value', { token: String(token) });
    return this;
  }

  /**
   * Register a factory function
   */
  factory<T>(token: Token<T>, factory: Factory<T>): this {
    return this.singleton(token, factory);
  }

  /**
   * Resolve a service
   */
  async resolve<T>(token: Token<T>): Promise<T> {
    // Check for circular dependencies
    if (this.resolving.has(token)) {
      throw new Error(`Circular dependency detected: ${String(token)}`);
    }

    const descriptor = this.services.get(token) || this.parent?.services.get(token);

    if (!descriptor) {
      throw new Error(`Service not found: ${String(token)}`);
    }

    // Return constant value if available
    if (descriptor.value !== undefined) {
      return descriptor.value;
    }

    // Check singleton cache
    if (descriptor.singleton) {
      const cached = this.singletons.get(token) || this.parent?.singletons.get(token);
      if (cached) {
        return cached;
      }
    }

    this.resolving.add(token);

    try {
      let instance: T;

      if (descriptor.factory) {
        instance = await descriptor.factory(this);
      } else if (descriptor.constructor) {
        const deps = await this.resolveDependencies(descriptor.dependencies || []);
        instance = new descriptor.constructor(...deps);
      } else {
        throw new Error(`No factory or constructor for: ${String(token)}`);
      }

      if (descriptor.singleton) {
        this.singletons.set(token, instance);
      }

      this.logger.debug('Resolved service', { token: String(token), singleton: descriptor.singleton });
      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  /**
   * Resolve multiple dependencies
   */
  private async resolveDependencies(deps: Token<any>[]): Promise<any[]> {
    return Promise.all(deps.map(dep => this.resolve(dep)));
  }

  /**
   * Get all services with a specific tag
   */
  async resolveTagged<T>(tag: string): Promise<T[]> {
    const services: T[] = [];

    for (const [token, descriptor] of this.services) {
      if (descriptor.tags?.includes(tag)) {
        const service = await this.resolve<T>(token);
        services.push(service);
      }
    }

    return services;
  }

  /**
   * Tag a service
   */
  tag(token: Token<any>, ...tags: string[]): this {
    const descriptor = this.services.get(token);
    if (descriptor) {
      descriptor.tags = [...(descriptor.tags || []), ...tags];
    }
    return this;
  }

  /**
   * Create a child container
   */
  createScope(): Container {
    return new Container(this);
  }

  /**
   * Dispose all singleton instances
   */
  async dispose(): Promise<void> {
    for (const [token, instance] of this.singletons) {
      if (typeof instance?.dispose === 'function') {
        try {
          await instance.dispose();
          this.logger.debug('Disposed service', { token: String(token) });
        } catch (error) {
          this.logger.error('Failed to dispose service', { token: String(token), error });
        }
      }
    }
    this.singletons.clear();
    this.services.clear();
  }
}

// Service tokens
export const TOKENS = {
  // Core
  ExtensionContext: Symbol('ExtensionContext'),
  Container: Symbol('Container'),
  Logger: Symbol('Logger'),

  // Services
  DiscoveryEngine: Symbol('DiscoveryEngine'),
  ScaffoldService: Symbol('ScaffoldService'),
  ConfigService: Symbol('ConfigService'),
  TelemetryService: Symbol('TelemetryService'),
  CacheService: Symbol('CacheService'),
  FileSystemService: Symbol('FileSystemService'),

  // Providers
  DiscoveryTreeProvider: Symbol('DiscoveryTreeProvider'),
  CodeLensProvider: Symbol('CodeLensProvider'),
  SmartTestProvider: Symbol('SmartTestProvider'),

  // WebView
  DiscoveryLensPanel: Symbol('DiscoveryLensPanel'),
  SmartTestsPanel: Symbol('SmartTestsPanel'),

  // Commands
  Commands: Symbol('Commands'),
} as const;

/**
 * Bootstrap the DI container with all services
 */
export async function bootstrapContainer(context: vscode.ExtensionContext): Promise<Container> {
  const container = new Container();

  // Register core services
  container.value(TOKENS.ExtensionContext, context);
  container.value(TOKENS.Container, container);

  // Register logger factory
  container.factory(TOKENS.Logger, () => createLogger('extension'));

  // Register configuration service
  container.singleton(TOKENS.ConfigService, async (c) => {
    const { ConfigService } = await import('./services/ConfigService');
    const logger = await c.resolve<Logger>(TOKENS.Logger);
    return new ConfigService(logger);
  });

  // Register cache service
  container.singleton(TOKENS.CacheService, async (c) => {
    const { CacheService } = await import('./services/CacheService');
    const logger = await c.resolve<Logger>(TOKENS.Logger);
    return new CacheService(logger);
  });

  // Register telemetry service
  container.singleton(TOKENS.TelemetryService, async (c) => {
    const { TelemetryService } = await import('./services/TelemetryService');
    const logger = await c.resolve<Logger>(TOKENS.Logger);
    const config = await c.resolve(TOKENS.ConfigService);
    return new TelemetryService(logger, config);
  });

  // Register file system service
  container.singleton(TOKENS.FileSystemService, async (c) => {
    const { FileSystemService } = await import('./services/FileSystemService');
    const logger = await c.resolve<Logger>(TOKENS.Logger);
    return new FileSystemService(logger);
  });

  // Register discovery engine
  container.singleton(TOKENS.DiscoveryEngine, async (c) => {
    const { DiscoveryEngineService } = await import('./services/DiscoveryEngineService');
    const logger = await c.resolve<Logger>(TOKENS.Logger);
    const cache = await c.resolve(TOKENS.CacheService);
    const fs = await c.resolve(TOKENS.FileSystemService);
    return new DiscoveryEngineService(logger, cache, fs);
  });

  // Register scaffold service
  container.singleton(TOKENS.ScaffoldService, async (c) => {
    const { ScaffoldService } = await import('./services/ScaffoldService');
    const logger = await c.resolve<Logger>(TOKENS.Logger);
    const discovery = await c.resolve(TOKENS.DiscoveryEngine);
    const fs = await c.resolve(TOKENS.FileSystemService);
    const config = await c.resolve(TOKENS.ConfigService);
    return new ScaffoldService(logger, discovery, fs, config);
  });

  // Register commands
  container.singleton(TOKENS.Commands, async (c) => {
    const { CommandManager } = await import('./commands/CommandManager');
    const logger = await c.resolve<Logger>(TOKENS.Logger);
    const scaffold = await c.resolve(TOKENS.ScaffoldService);
    const discovery = await c.resolve(TOKENS.DiscoveryEngine);
    return new CommandManager(context, logger, scaffold, discovery);
  });

  // Register providers
  container.singleton(TOKENS.DiscoveryTreeProvider, async (c) => {
    const { DiscoveryTreeProvider } = await import('../providers/DiscoveryTreeProvider');
    return new DiscoveryTreeProvider();
  });

  container.singleton(TOKENS.CodeLensProvider, async (c) => {
    const { AdaptiveTestsCodeLensProvider } = await import('../providers/CodeLensProvider');
    return new AdaptiveTestsCodeLensProvider();
  });

  // Initialize core services
  await container.resolve(TOKENS.Logger);
  await container.resolve(TOKENS.ConfigService);

  return container;
}

/**
 * Decorator to mark a class as injectable
 */
export function Injectable(token: Token<any>) {
  return function <T extends Constructor>(target: T) {
    Reflect.defineMetadata('di:token', token, target);
    return target;
  };
}

/**
 * Decorator to inject dependencies
 */
export function Inject(token: Token<any>) {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingTokens = Reflect.getMetadata('di:tokens', target) || [];
    existingTokens[parameterIndex] = token;
    Reflect.defineMetadata('di:tokens', existingTokens, target);
  };
}