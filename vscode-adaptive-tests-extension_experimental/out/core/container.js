"use strict";
/**
 * Dependency Injection Container
 * Implements IoC pattern for better testability and modularity
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = exports.Container = void 0;
exports.bootstrapContainer = bootstrapContainer;
exports.Injectable = Injectable;
exports.Inject = Inject;
const logger_1 = require("./logger");
class Container {
    constructor(parent) {
        this.parent = parent;
        this.services = new Map();
        this.singletons = new Map();
        this.resolving = new Set();
        this.logger = (0, logger_1.createLogger)('container');
    }
    /**
     * Register a singleton service
     */
    singleton(token, factory, deps) {
        const descriptor = {
            token,
            singleton: true,
            dependencies: deps,
            tags: []
        };
        if (typeof factory === 'function' && factory.prototype) {
            descriptor.constructor = factory;
        }
        else {
            descriptor.factory = factory;
        }
        this.services.set(token, descriptor);
        this.logger.debug('Registered singleton', { token: String(token) });
        return this;
    }
    /**
     * Register a transient service (new instance each time)
     */
    transient(token, factory, deps) {
        const descriptor = {
            token,
            singleton: false,
            dependencies: deps,
            tags: []
        };
        if (typeof factory === 'function' && factory.prototype) {
            descriptor.constructor = factory;
        }
        else {
            descriptor.factory = factory;
        }
        this.services.set(token, descriptor);
        this.logger.debug('Registered transient', { token: String(token) });
        return this;
    }
    /**
     * Register a constant value
     */
    value(token, value) {
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
    factory(token, factory) {
        return this.singleton(token, factory);
    }
    /**
     * Resolve a service
     */
    async resolve(token) {
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
            let instance;
            if (descriptor.factory) {
                instance = await descriptor.factory(this);
            }
            else if (descriptor.constructor) {
                const deps = await this.resolveDependencies(descriptor.dependencies || []);
                instance = new descriptor.constructor(...deps);
            }
            else {
                throw new Error(`No factory or constructor for: ${String(token)}`);
            }
            if (descriptor.singleton) {
                this.singletons.set(token, instance);
            }
            this.logger.debug('Resolved service', { token: String(token), singleton: descriptor.singleton });
            return instance;
        }
        finally {
            this.resolving.delete(token);
        }
    }
    /**
     * Resolve multiple dependencies
     */
    async resolveDependencies(deps) {
        return Promise.all(deps.map(dep => this.resolve(dep)));
    }
    /**
     * Get all services with a specific tag
     */
    async resolveTagged(tag) {
        const services = [];
        for (const [token, descriptor] of this.services) {
            if (descriptor.tags?.includes(tag)) {
                const service = await this.resolve(token);
                services.push(service);
            }
        }
        return services;
    }
    /**
     * Tag a service
     */
    tag(token, ...tags) {
        const descriptor = this.services.get(token);
        if (descriptor) {
            descriptor.tags = [...(descriptor.tags || []), ...tags];
        }
        return this;
    }
    /**
     * Create a child container
     */
    createScope() {
        return new Container(this);
    }
    /**
     * Dispose all singleton instances
     */
    async dispose() {
        for (const [token, instance] of this.singletons) {
            if (typeof instance?.dispose === 'function') {
                try {
                    await instance.dispose();
                    this.logger.debug('Disposed service', { token: String(token) });
                }
                catch (error) {
                    this.logger.error('Failed to dispose service', { token: String(token), error });
                }
            }
        }
        this.singletons.clear();
        this.services.clear();
    }
}
exports.Container = Container;
// Service tokens
exports.TOKENS = {
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
};
/**
 * Bootstrap the DI container with all services
 */
async function bootstrapContainer(context) {
    const container = new Container();
    // Register core services
    container.value(exports.TOKENS.ExtensionContext, context);
    container.value(exports.TOKENS.Container, container);
    // Register logger factory
    container.factory(exports.TOKENS.Logger, () => (0, logger_1.createLogger)('extension'));
    // Register configuration service
    container.singleton(exports.TOKENS.ConfigService, async (c) => {
        const { ConfigService } = await Promise.resolve().then(() => __importStar(require('./services/ConfigService')));
        const logger = await c.resolve(exports.TOKENS.Logger);
        return new ConfigService(logger);
    });
    // Register cache service
    container.singleton(exports.TOKENS.CacheService, async (c) => {
        const { CacheService } = await Promise.resolve().then(() => __importStar(require('./services/CacheService')));
        const logger = await c.resolve(exports.TOKENS.Logger);
        return new CacheService(logger);
    });
    // Register telemetry service
    container.singleton(exports.TOKENS.TelemetryService, async (c) => {
        const { TelemetryService } = await Promise.resolve().then(() => __importStar(require('./services/TelemetryService')));
        const logger = await c.resolve(exports.TOKENS.Logger);
        const config = await c.resolve(exports.TOKENS.ConfigService);
        return new TelemetryService(logger, config);
    });
    // Register file system service
    container.singleton(exports.TOKENS.FileSystemService, async (c) => {
        const { FileSystemService } = await Promise.resolve().then(() => __importStar(require('./services/FileSystemService')));
        const logger = await c.resolve(exports.TOKENS.Logger);
        return new FileSystemService(logger);
    });
    // Register discovery engine
    container.singleton(exports.TOKENS.DiscoveryEngine, async (c) => {
        const { DiscoveryEngineService } = await Promise.resolve().then(() => __importStar(require('./services/DiscoveryEngineService')));
        const logger = await c.resolve(exports.TOKENS.Logger);
        const cache = await c.resolve(exports.TOKENS.CacheService);
        const fs = await c.resolve(exports.TOKENS.FileSystemService);
        return new DiscoveryEngineService(logger, cache, fs);
    });
    // Register scaffold service
    container.singleton(exports.TOKENS.ScaffoldService, async (c) => {
        const { ScaffoldService } = await Promise.resolve().then(() => __importStar(require('./services/ScaffoldService')));
        const logger = await c.resolve(exports.TOKENS.Logger);
        const discovery = await c.resolve(exports.TOKENS.DiscoveryEngine);
        const fs = await c.resolve(exports.TOKENS.FileSystemService);
        const config = await c.resolve(exports.TOKENS.ConfigService);
        return new ScaffoldService(logger, discovery, fs, config);
    });
    // Register commands
    container.singleton(exports.TOKENS.Commands, async (c) => {
        const { CommandManager } = await Promise.resolve().then(() => __importStar(require('./commands/CommandManager')));
        const logger = await c.resolve(exports.TOKENS.Logger);
        const scaffold = await c.resolve(exports.TOKENS.ScaffoldService);
        const discovery = await c.resolve(exports.TOKENS.DiscoveryEngine);
        return new CommandManager(context, logger, scaffold, discovery);
    });
    // Register providers
    container.singleton(exports.TOKENS.DiscoveryTreeProvider, async (c) => {
        const { DiscoveryTreeProvider } = await Promise.resolve().then(() => __importStar(require('../providers/DiscoveryTreeProvider')));
        return new DiscoveryTreeProvider();
    });
    container.singleton(exports.TOKENS.CodeLensProvider, async (c) => {
        const { AdaptiveTestsCodeLensProvider } = await Promise.resolve().then(() => __importStar(require('../providers/CodeLensProvider')));
        return new AdaptiveTestsCodeLensProvider();
    });
    // Initialize core services
    await container.resolve(exports.TOKENS.Logger);
    await container.resolve(exports.TOKENS.ConfigService);
    return container;
}
/**
 * Decorator to mark a class as injectable
 */
function Injectable(token) {
    return function (target) {
        Reflect.defineMetadata('di:token', token, target);
        return target;
    };
}
/**
 * Decorator to inject dependencies
 */
function Inject(token) {
    return function (target, propertyKey, parameterIndex) {
        const existingTokens = Reflect.getMetadata('di:tokens', target) || [];
        existingTokens[parameterIndex] = token;
        Reflect.defineMetadata('di:tokens', existingTokens, target);
    };
}
//# sourceMappingURL=container.js.map