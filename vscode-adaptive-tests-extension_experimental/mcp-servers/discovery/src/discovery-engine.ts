import type { DiscoverySignature } from '@adaptive-tests/javascript';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'fast-glob';

export class DiscoveryEngine {
  private adaptiveTests: any;

  async discover(
    workspaceRoot: string,
    signature: DiscoverySignature,
    options: { maxResults?: number; includeScores?: boolean; language?: string }
  ) {
    // Lazy load the adaptive tests module
    if (!this.adaptiveTests) {
      this.adaptiveTests = await import('@adaptive-tests/javascript');
    }

    const engine = new this.adaptiveTests.DiscoveryEngine(workspaceRoot);
    const candidates = await engine.collectCandidates(workspaceRoot, signature);

    // Sort by score
    candidates.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    // Limit results
    const limited = candidates.slice(0, options.maxResults || 10);

    // Format results
    return limited.map((candidate: any) => ({
      path: candidate.path || candidate.absolutePath,
      relativePath: path.relative(workspaceRoot, candidate.path || candidate.absolutePath),
      score: options.includeScores ? candidate.score : undefined,
      language: candidate.language || this.detectLanguage(candidate.path || candidate.absolutePath),
      metadata: candidate.metadata || {}
    }));
  }

  async analyzeWorkspace(workspaceRoot: string) {
    const stats = {
      totalFiles: 0,
      languages: {} as Record<string, number>,
      testFiles: 0,
      sourceFiles: 0,
      frameworks: [] as string[],
      recommendations: [] as string[]
    };

    // Find all source files
    const files = await glob('**/*.{js,ts,jsx,tsx,java,php,py,go,rs}', {
      cwd: workspaceRoot,
      ignore: ['**/node_modules/**', '**/vendor/**', '**/.git/**', '**/dist/**', '**/build/**'],
      onlyFiles: true
    });

    stats.totalFiles = files.length;

    // Analyze file types
    for (const file of files) {
      const ext = path.extname(file);
      const lang = this.getLanguageFromExt(ext);
      stats.languages[lang] = (stats.languages[lang] || 0) + 1;

      if (file.includes('test') || file.includes('spec')) {
        stats.testFiles++;
      } else {
        stats.sourceFiles++;
      }
    }

    // Detect frameworks
    try {
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps['react']) stats.frameworks.push('React');
      if (deps['vue']) stats.frameworks.push('Vue');
      if (deps['@angular/core']) stats.frameworks.push('Angular');
      if (deps['express']) stats.frameworks.push('Express');
      if (deps['jest']) stats.frameworks.push('Jest');
      if (deps['vitest']) stats.frameworks.push('Vitest');
      if (deps['mocha']) stats.frameworks.push('Mocha');
    } catch {
      // No package.json or error reading it
    }

    // Generate recommendations
    if (stats.testFiles < stats.sourceFiles * 0.3) {
      stats.recommendations.push('Consider adding more test coverage (currently ' +
        Math.round(stats.testFiles / stats.sourceFiles * 100) + '%)');
    }

    if (!stats.frameworks.some(f => ['Jest', 'Vitest', 'Mocha'].includes(f))) {
      stats.recommendations.push('Consider adding a test framework');
    }

    const mainLanguage = Object.entries(stats.languages)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    if (mainLanguage) {
      stats.recommendations.push(`Primary language detected: ${mainLanguage}`);
    }

    return stats;
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return this.getLanguageFromExt(ext);
  }

  private getLanguageFromExt(ext: string): string {
    const langMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.java': 'java',
      '.php': 'php',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust'
    };
    return langMap[ext] || 'unknown';
  }
}