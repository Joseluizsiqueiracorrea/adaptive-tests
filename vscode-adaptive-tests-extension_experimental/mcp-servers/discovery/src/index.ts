/**
 * Adaptive Tests Discovery MCP Server
 * Provides AI-powered test discovery capabilities via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport, SSEServerTransport } from '@modelcontextprotocol/sdk/server/transports.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { LRUCache } from 'lru-cache';
import PQueue from 'p-queue';
import { createLogger } from './logger.js';
import { DiscoveryEngine } from './discovery-engine.js';
import { AuthManager } from './auth.js';

const logger = createLogger('mcp-discovery');

// Schemas for validation
const DiscoverySignatureSchema = z.object({
  name: z.string().min(1).max(256),
  type: z.enum(['class', 'function', 'interface', 'method', 'variable']).optional(),
  methods: z.array(z.string()).optional(),
  properties: z.array(z.string()).optional(),
  extends: z.string().optional(),
  implements: z.array(z.string()).optional(),
  params: z.array(z.any()).optional(),
  returnType: z.string().optional()
});

const DiscoveryOptionsSchema = z.object({
  workspaceRoot: z.string(),
  maxResults: z.number().min(1).max(100).default(10),
  includeScores: z.boolean().default(true),
  language: z.string().optional()
});

export class AdaptiveTestsDiscoveryServer {
  private server: Server;
  private discoveryEngine: DiscoveryEngine;
  private cache: LRUCache<string, any>;
  private queue: PQueue;
  private authManager: AuthManager;
  private activeSessions: Map<string, DiscoverySession>;

  constructor() {
    this.server = new Server({
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

    this.discoveryEngine = new DiscoveryEngine();
    this.authManager = new AuthManager();
    this.activeSessions = new Map();

    // High-performance cache with 15-minute TTL
    this.cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 15,
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });

    // Queue for rate limiting (max 10 concurrent operations)
    this.queue = new PQueue({ concurrency: 10 });

    this.setupHandlers();
  }

  private setupHandlers() {
    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
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

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
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
          throw new McpError(ErrorCode.ResourceNotFound, `Session ${sessionId} not found`);
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
              hits: (this.cache as any).hits || 0,
              misses: (this.cache as any).misses || 0
            }, null, 2)
          }]
        };
      }

      throw new McpError(ErrorCode.ResourceNotFound, `Resource ${uri} not found`);
    });

    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
          throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
      }
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
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

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
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
          throw new McpError(ErrorCode.MethodNotFound, `Prompt ${name} not found`);
      }
    });
  }

  private async handleDiscover(args: any) {
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

        const candidates = await this.discoveryEngine.discover(
          options.workspaceRoot,
          signature,
          options
        );

        // Create session
        const session: DiscoverySession = {
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
    } catch (error) {
      logger.error('Discovery failed', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async handleAnalyzeWorkspace(args: any) {
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

  async start(transport: 'stdio' | 'sse' = 'stdio') {
    logger.info('Starting MCP Discovery Server', { transport });

    const transportImpl = transport === 'stdio'
      ? new StdioServerTransport()
      : new SSEServerTransport('/mcp/discovery');

    await this.server.connect(transportImpl);

    logger.info('MCP Discovery Server started successfully');
  }
}

interface DiscoverySession {
  id: string;
  signature: z.infer<typeof DiscoverySignatureSchema>;
  results: any[];
  timestamp: string;
  options: z.infer<typeof DiscoveryOptionsSchema>;
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AdaptiveTestsDiscoveryServer();
  const transport = process.env.MCP_TRANSPORT as 'stdio' | 'sse' || 'stdio';
  server.start(transport).catch(console.error);
}