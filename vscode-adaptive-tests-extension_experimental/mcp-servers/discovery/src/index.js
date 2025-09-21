"use strict";
/**
 * Adaptive Tests Discovery MCP Server
 * Provides AI-powered test discovery capabilities via Model Context Protocol
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveTestsDiscoveryServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const transports_js_1 = require("@modelcontextprotocol/sdk/server/transports.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const zod_1 = require("zod");
const lru_cache_1 = require("lru-cache");
const p_queue_1 = __importDefault(require("p-queue"));
const logger_js_1 = require("./logger.js");
const discovery_engine_js_1 = require("./discovery-engine.js");
const auth_js_1 = require("./auth.js");
const logger = (0, logger_js_1.createLogger)('mcp-discovery');
// Schemas for validation
const DiscoverySignatureSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(256),
    type: zod_1.z.enum(['class', 'function', 'interface', 'method', 'variable']).optional(),
    methods: zod_1.z.array(zod_1.z.string()).optional(),
    properties: zod_1.z.array(zod_1.z.string()).optional(),
    extends: zod_1.z.string().optional(),
    implements: zod_1.z.array(zod_1.z.string()).optional(),
    params: zod_1.z.array(zod_1.z.any()).optional(),
    returnType: zod_1.z.string().optional()
});
const DiscoveryOptionsSchema = zod_1.z.object({
    workspaceRoot: zod_1.z.string(),
    maxResults: zod_1.z.number().min(1).max(100).default(10),
    includeScores: zod_1.z.boolean().default(true),
    language: zod_1.z.string().optional()
});
class AdaptiveTestsDiscoveryServer {
    constructor() {
        this.server = new index_js_1.Server({
            name: 'adaptive-tests-discovery',
            version: '1.0.0'
        }, {
            capabilities: {
                resources: {},
                tools: {},
                prompts: {},
                sampling: {}
            }
        });
        this.discoveryEngine = new discovery_engine_js_1.DiscoveryEngine();
        this.authManager = new auth_js_1.AuthManager();
        this.activeSessions = new Map();
        // High-performance cache with 15-minute TTL
        this.cache = new lru_cache_1.LRUCache({
            max: 500,
            ttl: 1000 * 60 * 15,
            updateAgeOnGet: true,
            updateAgeOnHas: true
        });
        // Queue for rate limiting (max 10 concurrent operations)
        this.queue = new p_queue_1.default({ concurrency: 10 });
        this.setupHandlers();
    }
    setupHandlers() {
        // Resource handlers
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
            const sessions = Array.from(this.activeSessions.values());
            return {
                resources: [
                    {
                        uri: `discovery://sessions`,
                        name: 'Active Discovery Sessions',
                        description: 'List of active discovery sessions',
                        mimeType: 'application/json'
                    },
                    ...sessions.map(session => ({
                        uri: `discovery://session/${session.id}`,
                        name: `Session ${session.id}`,
                        description: `Discovery results for ${session.signature.name}`,
                        mimeType: 'application/json'
                    })),
                    {
                        uri: `discovery://cache/stats`,
                        name: 'Cache Statistics',
                        description: 'Discovery cache performance metrics',
                        mimeType: 'application/json'
                    }
                ]
            };
        });
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            if (uri === 'discovery://sessions') {
                return {
                    contents: [{
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify({
                                sessions: Array.from(this.activeSessions.values()).map(s => ({
                                    id: s.id,
                                    signature: s.signature,
                                    resultCount: s.results.length,
                                    timestamp: s.timestamp
                                }))
                            }, null, 2)
                        }]
                };
            }
            if (uri.startsWith('discovery://session/')) {
                const sessionId = uri.replace('discovery://session/', '');
                const session = this.activeSessions.get(sessionId);
                if (!session) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.ResourceNotFound, `Session ${sessionId} not found`);
                }
                return {
                    contents: [{
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(session, null, 2)
                        }]
                };
            }
            if (uri === 'discovery://cache/stats') {
                return {
                    contents: [{
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify({
                                size: this.cache.size,
                                calculatedSize: this.cache.calculatedSize,
                                hits: this.cache.hits || 0,
                                misses: this.cache.misses || 0
                            }, null, 2)
                        }]
                };
            }
            throw new types_js_1.McpError(types_js_1.ErrorCode.ResourceNotFound, `Resource ${uri} not found`);
        });
        // Tool handlers
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'discover',
                        description: 'Run discovery to find matching code elements',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                signature: {
                                    type: 'object',
                                    description: 'Discovery signature',
                                    properties: {
                                        name: { type: 'string', description: 'Name to search for' },
                                        type: {
                                            type: 'string',
                                            enum: ['class', 'function', 'interface', 'method', 'variable'],
                                            description: 'Type of code element'
                                        },
                                        methods: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            description: 'Expected methods'
                                        }
                                    },
                                    required: ['name']
                                },
                                options: {
                                    type: 'object',
                                    properties: {
                                        workspaceRoot: { type: 'string', description: 'Workspace root path' },
                                        maxResults: { type: 'number', description: 'Maximum results (1-100)' },
                                        includeScores: { type: 'boolean', description: 'Include scoring details' }
                                    },
                                    required: ['workspaceRoot']
                                }
                            },
                            required: ['signature', 'options']
                        }
                    },
                    {
                        name: 'clearCache',
                        description: 'Clear the discovery cache',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'analyzeWorkspace',
                        description: 'Analyze workspace for discovery readiness',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspaceRoot: { type: 'string', description: 'Workspace root path' }
                            },
                            required: ['workspaceRoot']
                        }
                    }
                ]
            };
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case 'discover':
                    return await this.handleDiscover(args);
                case 'clearCache':
                    this.cache.clear();
                    return {
                        content: [{
                                type: 'text',
                                text: 'Cache cleared successfully'
                            }]
                    };
                case 'analyzeWorkspace':
                    return await this.handleAnalyzeWorkspace(args);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Tool ${name} not found`);
            }
        });
        // Prompt handlers
        this.server.setRequestHandler(types_js_1.ListPromptsRequestSchema, async () => {
            return {
                prompts: [
                    {
                        name: 'find_implementation',
                        description: 'Find implementation of a class or function',
                        arguments: [
                            { name: 'name', description: 'Name of the class/function', required: true },
                            { name: 'type', description: 'Type (class/function/interface)', required: false }
                        ]
                    },
                    {
                        name: 'find_tests',
                        description: 'Find existing tests for a code element',
                        arguments: [
                            { name: 'targetFile', description: 'Path to the source file', required: true }
                        ]
                    },
                    {
                        name: 'suggest_discovery',
                        description: 'Suggest discovery signatures based on workspace',
                        arguments: [
                            { name: 'workspaceRoot', description: 'Workspace root path', required: true }
                        ]
                    }
                ]
            };
        });
        this.server.setRequestHandler(types_js_1.GetPromptRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case 'find_implementation':
                    return {
                        messages: [
                            {
                                role: 'user',
                                content: {
                                    type: 'text',
                                    text: `Find the implementation of "${args?.name}" (type: ${args?.type || 'any'}) in the codebase. Use the discovery tool to locate matching code elements.`
                                }
                            }
                        ]
                    };
                case 'find_tests':
                    return {
                        messages: [
                            {
                                role: 'user',
                                content: {
                                    type: 'text',
                                    text: `Find all test files related to "${args?.targetFile}". Look for test files that import or reference this file.`
                                }
                            }
                        ]
                    };
                case 'suggest_discovery':
                    return {
                        messages: [
                            {
                                role: 'user',
                                content: {
                                    type: 'text',
                                    text: `Analyze the workspace at "${args?.workspaceRoot}" and suggest useful discovery signatures based on the codebase structure and common patterns.`
                                }
                            }
                        ]
                    };
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Prompt ${name} not found`);
            }
        });
    }
    async handleDiscover(args) {
        try {
            // Validate input
            const signature = DiscoverySignatureSchema.parse(args.signature);
            const options = DiscoveryOptionsSchema.parse(args.options);
            // Check cache
            const cacheKey = `${JSON.stringify(signature)}:${options.workspaceRoot}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                logger.info('Cache hit for discovery', { signature: signature.name });
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(cached, null, 2)
                        }]
                };
            }
            // Queue the discovery operation
            const results = await this.queue.add(async () => {
                logger.info('Starting discovery', { signature: signature.name, workspace: options.workspaceRoot });
                const candidates = await this.discoveryEngine.discover(options.workspaceRoot, signature, options);
                // Create session
                const session = {
                    id: crypto.randomUUID(),
                    signature,
                    results: candidates.slice(0, options.maxResults),
                    timestamp: new Date().toISOString(),
                    options
                };
                this.activeSessions.set(session.id, session);
                // Cleanup old sessions (keep last 20)
                if (this.activeSessions.size > 20) {
                    const oldest = Array.from(this.activeSessions.keys())[0];
                    this.activeSessions.delete(oldest);
                }
                return session;
            });
            // Cache results
            this.cache.set(cacheKey, results);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(results, null, 2)
                    }]
            };
        }
        catch (error) {
            logger.error('Discovery failed', error);
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleAnalyzeWorkspace(args) {
        const { workspaceRoot } = args;
        const analysis = await this.queue.add(async () => {
            return await this.discoveryEngine.analyzeWorkspace(workspaceRoot);
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(analysis, null, 2)
                }]
        };
    }
    async start(transport = 'stdio') {
        logger.info('Starting MCP Discovery Server', { transport });
        const transportImpl = transport === 'stdio'
            ? new transports_js_1.StdioServerTransport()
            : new transports_js_1.SSEServerTransport('/mcp/discovery');
        await this.server.connect(transportImpl);
        logger.info('MCP Discovery Server started successfully');
    }
}
exports.AdaptiveTestsDiscoveryServer = AdaptiveTestsDiscoveryServer;
// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new AdaptiveTestsDiscoveryServer();
    const transport = process.env.MCP_TRANSPORT || 'stdio';
    server.start(transport).catch(console.error);
}
//# sourceMappingURL=index.js.map