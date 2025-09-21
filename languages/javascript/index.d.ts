/**
 * Adaptive Testing - TypeScript Definitions
 */

export type TargetType = 'class' | 'function' | 'object' | 'module';

export interface DiscoverySignature {
  name?: string | RegExp;
  type?: TargetType;
  exports?: string;
  methods?: string[];
  properties?: string[];
  extends?: string | Function;
  instanceof?: string | Function;
  language?: string;
}

export interface DiscoveryOptions {
  rootPath?: string;
  config?: any;
}

export class DiscoveryEngine {
  constructor(rootPath?: string, config?: any);
  discoverTarget<T = any>(signature: DiscoverySignature): Promise<T>;
  clearCache(): Promise<void>;
}

export class AdaptiveTest {
  constructor();
  getTargetSignature(): DiscoverySignature;
  runTests(target: any): Promise<void> | void;
  execute(): Promise<void>;
}

export function getDiscoveryEngine(rootPath?: string): DiscoveryEngine;
export function adaptiveTest(signature: DiscoverySignature): Promise<any>;
export function discover<T = any>(
  signature: string | DiscoverySignature,
  rootPath?: string
): Promise<T>;

export class ConfigLoader {
  constructor(rootPath?: string);
  load(inlineConfig?: any): any;
}

export class ScoringEngine {
  constructor(config?: any);
  calculateScore(candidate: any, signature: DiscoverySignature, content?: any): number;
}

export function setLogger(logger: any): void;
export function getLogger(component?: string): any;

export const DEFAULT_CONFIG: any;
