/**
 * Authentication Manager for MCP Server
 * Supports OAuth2, API Keys, and VS Code authentication bridge
 */

import { createLogger } from './logger.js';

const logger = createLogger('auth');

interface AuthToken {
  type: 'oauth2' | 'api-key' | 'vscode';
  token: string;
  expiresAt?: Date;
  scopes?: string[];
}

interface AuthProvider {
  validate(token: string): Promise<AuthToken | null>;
  refresh?(token: string): Promise<AuthToken | null>;
}

export class AuthManager {
  private providers: Map<string, AuthProvider> = new Map();
  private tokenCache: Map<string, AuthToken> = new Map();

  constructor() {
    this.setupProviders();
  }

  private setupProviders() {
    // VS Code authentication bridge (default)
    this.providers.set('vscode', new VSCodeAuthProvider());

    // OAuth2 provider (for future GitHub/Azure integration)
    this.providers.set('oauth2', new OAuth2Provider());

    // API Key provider
    this.providers.set('api-key', new ApiKeyProvider());
  }

  async authenticate(authHeader?: string): Promise<AuthToken | null> {
    if (!authHeader) {
      // No auth required in development mode
      if (process.env.NODE_ENV === 'development') {
        return {
          type: 'vscode',
          token: 'dev-token',
          scopes: ['*']
        };
      }
      return null;
    }

    // Check cache
    const cached = this.tokenCache.get(authHeader);
    if (cached && (!cached.expiresAt || cached.expiresAt > new Date())) {
      return cached;
    }

    // Try each provider
    for (const [name, provider] of this.providers) {
      try {
        const token = await provider.validate(authHeader);
        if (token) {
          this.tokenCache.set(authHeader, token);
          logger.info('Authentication successful', { provider: name });
          return token;
        }
      } catch (error) {
        logger.warn('Auth provider failed', { provider: name, error });
      }
    }

    return null;
  }

  hasScope(token: AuthToken, requiredScope: string): boolean {
    if (!token.scopes) return false;
    if (token.scopes.includes('*')) return true;
    return token.scopes.includes(requiredScope);
  }
}

class VSCodeAuthProvider implements AuthProvider {
  async validate(token: string): Promise<AuthToken | null> {
    // Validate VS Code extension token
    // This would integrate with VS Code's authentication API
    if (token.startsWith('vscode:')) {
      return {
        type: 'vscode',
        token: token.substring(7),
        scopes: ['discovery', 'scaffold']
      };
    }
    return null;
  }
}

class OAuth2Provider implements AuthProvider {
  private tokenEndpoint = process.env.OAUTH2_TOKEN_ENDPOINT;
  private clientId = process.env.OAUTH2_CLIENT_ID;
  private clientSecret = process.env.OAUTH2_CLIENT_SECRET;

  async validate(token: string): Promise<AuthToken | null> {
    if (!token.startsWith('Bearer ')) {
      return null;
    }

    const accessToken = token.substring(7);

    // Validate with OAuth2 provider (GitHub, Azure, etc.)
    if (this.tokenEndpoint) {
      try {
        const response = await fetch(`${this.tokenEndpoint}/validate`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          return {
            type: 'oauth2',
            token: accessToken,
            expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
            scopes: data.scopes || []
          };
        }
      } catch (error) {
        logger.error('OAuth2 validation failed', error);
      }
    }

    return null;
  }

  async refresh(refreshToken: string): Promise<AuthToken | null> {
    if (!this.tokenEndpoint || !this.clientId || !this.clientSecret) {
      return null;
    }

    try {
      const response = await fetch(`${this.tokenEndpoint}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          type: 'oauth2',
          token: data.access_token,
          expiresAt: data.expires_in
            ? new Date(Date.now() + data.expires_in * 1000)
            : undefined,
          scopes: data.scope ? data.scope.split(' ') : []
        };
      }
    } catch (error) {
      logger.error('OAuth2 refresh failed', error);
    }

    return null;
  }
}

class ApiKeyProvider implements AuthProvider {
  private validKeys: Set<string>;

  constructor() {
    // Load API keys from environment or configuration
    const keys = process.env.API_KEYS?.split(',') || [];
    this.validKeys = new Set(keys);
  }

  async validate(token: string): Promise<AuthToken | null> {
    if (!token.startsWith('ApiKey ')) {
      return null;
    }

    const apiKey = token.substring(7);

    if (this.validKeys.has(apiKey)) {
      return {
        type: 'api-key',
        token: apiKey,
        scopes: ['discovery'] // Limited scope for API keys
      };
    }

    return null;
  }
}