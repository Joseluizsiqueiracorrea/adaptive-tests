/**
 * Easter Eggs and Delightful Features
 * Hidden surprises and achievements for users
 */

import * as vscode from 'vscode';
import { Logger } from '../core/logger';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: number;
  secret?: boolean;
}

export class EasterEggsService implements vscode.Disposable {
  private achievements: Map<string, Achievement> = new Map();
  private konamiSequence: string[] = [];
  private readonly KONAMI_CODE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
  private testsGenerated = 0;
  private discoveryRuns = 0;
  private startTime = Date.now();
  private easterEggActivated = false;
  private disposables: vscode.Disposable[] = [];

  constructor(private logger: Logger) {
    this.initializeAchievements();
    this.setupEventListeners();
    this.logger.info('EasterEggsService initialized');
  }

  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      {
        id: 'first-test',
        name: 'Test Pioneer',
        description: 'Generate your first adaptive test',
        icon: '🎯',
        points: 10,
        unlocked: false
      },
      {
        id: 'ten-tests',
        name: 'Test Enthusiast',
        description: 'Generate 10 adaptive tests',
        icon: '🔥',
        points: 25,
        unlocked: false
      },
      {
        id: 'hundred-tests',
        name: 'Test Master',
        description: 'Generate 100 adaptive tests',
        icon: '🏆',
        points: 100,
        unlocked: false
      },
      {
        id: 'ai-wizard',
        name: 'AI Wizard',
        description: 'Use all AI providers at least once',
        icon: '🧙‍♂️',
        points: 50,
        unlocked: false
      },
      {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Generate 5 tests in under a minute',
        icon: '⚡',
        points: 30,
        unlocked: false
      },
      {
        id: 'night-owl',
        name: 'Night Owl',
        description: 'Generate tests after midnight',
        icon: '🦉',
        points: 20,
        unlocked: false
      },
      {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Generate tests before 6 AM',
        icon: '🐦',
        points: 20,
        unlocked: false
      },
      {
        id: 'discovery-master',
        name: 'Discovery Master',
        description: 'Run discovery 100 times',
        icon: '🔍',
        points: 40,
        unlocked: false
      },
      {
        id: 'konami',
        name: 'Secret Keeper',
        description: '???',
        icon: '🕹️',
        points: 100,
        unlocked: false,
        secret: true
      },
      {
        id: 'persistent',
        name: 'Persistent Tester',
        description: 'Use the extension for 30 days',
        icon: '💪',
        points: 75,
        unlocked: false
      },
      {
        id: 'polyglot',
        name: 'Polyglot',
        description: 'Generate tests for 5 different languages',
        icon: '🌍',
        points: 60,
        unlocked: false
      },
      {
        id: 'perfection',
        name: 'Perfectionist',
        description: 'Generate a test with 100% coverage',
        icon: '💯',
        points: 50,
        unlocked: false
      }
    ];

    achievements.forEach(a => this.achievements.set(a.id, a));
    this.loadUnlockedAchievements();
  }

  private setupEventListeners(): void {
    // Listen for keyboard events in webviews
    vscode.commands.registerCommand('adaptive-tests.konamiKey', (key: string) => {
      this.handleKonamiInput(key);
    });
  }

  /**
   * Track test generation for achievements
   */
  public onTestGenerated(language?: string): void {
    this.testsGenerated++;

    // Check time-based achievements
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      this.unlockAchievement('early-bird');
    } else if (hour >= 0 && hour < 4) {
      this.unlockAchievement('night-owl');
    }

    // Check count-based achievements
    if (this.testsGenerated === 1) {
      this.unlockAchievement('first-test');
      this.showCelebration('🎉 Congratulations on your first test!');
    } else if (this.testsGenerated === 10) {
      this.unlockAchievement('ten-tests');
      this.showCelebration('🔥 10 tests generated! You\'re on fire!');
    } else if (this.testsGenerated === 100) {
      this.unlockAchievement('hundred-tests');
      this.showEpicCelebration();
    }

    // Check for speed demon
    this.checkSpeedDemonAchievement();

    // Random encouragement
    if (this.testsGenerated % 5 === 0 && Math.random() < 0.3) {
      this.showRandomEncouragement();
    }
  }

  /**
   * Track discovery runs
   */
  public onDiscoveryRun(): void {
    this.discoveryRuns++;

    if (this.discoveryRuns === 100) {
      this.unlockAchievement('discovery-master');
      this.showCelebration('🔍 Discovery Master unlocked!');
    }
  }

  /**
   * Track AI provider usage
   */
  public onAIProviderUsed(provider: string): void {
    const context = this.getExtensionContext();
    if (!context) return;

    const usedProviders = context.globalState.get<Set<string>>('usedAIProviders', new Set());
    usedProviders.add(provider);
    context.globalState.update('usedAIProviders', usedProviders);

    if (usedProviders.size >= 4) {
      this.unlockAchievement('ai-wizard');
    }
  }

  /**
   * Handle Konami code input
   */
  private handleKonamiInput(key: string): void {
    this.konamiSequence.push(key.toLowerCase());

    if (this.konamiSequence.length > this.KONAMI_CODE.length) {
      this.konamiSequence.shift();
    }

    if (this.konamiSequence.join(',') === this.KONAMI_CODE.join(',')) {
      this.activateKonamiEasterEgg();
    }
  }

  /**
   * Activate Konami code easter egg
   */
  private activateKonamiEasterEgg(): void {
    if (this.easterEggActivated) return;

    this.easterEggActivated = true;
    this.unlockAchievement('konami');

    // Show special effects
    vscode.window.showInformationMessage(
      '🕹️ KONAMI CODE ACTIVATED! You\'ve unlocked the secret!',
      'Show Achievements'
    ).then(selection => {
      if (selection === 'Show Achievements') {
        this.showAchievements();
      }
    });

    // Add special theme temporarily
    this.activateRetroMode();

    // Reset after 30 seconds
    setTimeout(() => {
      this.easterEggActivated = false;
      this.deactivateRetroMode();
    }, 30000);
  }

  /**
   * Activate retro mode (8-bit style)
   */
  private activateRetroMode(): void {
    vscode.commands.executeCommand('adaptive-tests.activateRetroMode');

    // Play 8-bit sound if possible
    this.play8BitSound();
  }

  private deactivateRetroMode(): void {
    vscode.commands.executeCommand('adaptive-tests.deactivateRetroMode');
  }

  /**
   * Show celebration animation
   */
  private showCelebration(message: string): void {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: message,
      cancellable: false
    }, async (progress) => {
      for (let i = 0; i <= 100; i += 10) {
        progress.report({ increment: 10 });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });
  }

  /**
   * Show epic celebration for major milestones
   */
  private showEpicCelebration(): void {
    const panel = vscode.window.createWebviewPanel(
      'celebration',
      '🎉 Achievement Unlocked!',
      vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );

    panel.webview.html = this.getCelebrationHTML();

    setTimeout(() => {
      panel.dispose();
    }, 5000);
  }

  /**
   * Show random encouragement messages
   */
  private showRandomEncouragement(): void {
    const messages = [
      '💪 Keep going! Your tests are looking great!',
      '🌟 You\'re doing amazing!',
      '🚀 Test coverage increasing!',
      '✨ Quality code deserves quality tests!',
      '🎯 Another perfect test!',
      '🔥 You\'re on a roll!',
      '💯 Test game strong!',
      '🎨 Beautiful tests you\'re creating!',
      '⚡ Lightning fast test generation!',
      '🏆 Champion test writer!'
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    vscode.window.setStatusBarMessage(message, 3000);
  }

  /**
   * Check for speed demon achievement
   */
  private checkSpeedDemonAchievement(): void {
    const context = this.getExtensionContext();
    if (!context) return;

    const recentTests = context.globalState.get<number[]>('recentTestTimes', []);
    const now = Date.now();

    recentTests.push(now);

    // Keep only tests from last minute
    const oneMinuteAgo = now - 60000;
    const filtered = recentTests.filter(t => t > oneMinuteAgo);

    if (filtered.length >= 5) {
      this.unlockAchievement('speed-demon');
    }

    context.globalState.update('recentTestTimes', filtered);
  }

  /**
   * Unlock an achievement
   */
  private unlockAchievement(id: string): void {
    const achievement = this.achievements.get(id);
    if (!achievement || achievement.unlocked) return;

    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();

    this.saveAchievements();
    this.notifyAchievement(achievement);
  }

  /**
   * Notify user of achievement
   */
  private notifyAchievement(achievement: Achievement): void {
    const message = `${achievement.icon} Achievement Unlocked: ${achievement.name}`;

    vscode.window.showInformationMessage(
      message,
      'View All'
    ).then(selection => {
      if (selection === 'View All') {
        this.showAchievements();
      }
    });

    this.logger.info('Achievement unlocked', {
      id: achievement.id,
      name: achievement.name
    });
  }

  /**
   * Show all achievements
   */
  public async showAchievements(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'achievements',
      '🏆 Achievements',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    panel.webview.html = this.getAchievementsHTML();
  }

  /**
   * Get celebration HTML
   */
  private getCelebrationHTML(): string {
    return `<!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        }
        .celebration {
          text-align: center;
          animation: bounce 1s infinite;
        }
        .emoji {
          font-size: 120px;
          animation: rotate 2s linear infinite;
        }
        .text {
          font-size: 32px;
          color: white;
          margin-top: 20px;
          font-weight: bold;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .particle {
          position: absolute;
          font-size: 30px;
          animation: fall linear infinite;
        }
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      </style>
    </head>
    <body>
      <div class="particles" id="particles"></div>
      <div class="celebration">
        <div class="emoji">🏆</div>
        <div class="text">Achievement Unlocked!</div>
      </div>
      <script>
        const particles = ['🎉', '🎊', '✨', '🌟', '⭐', '💫'];
        const container = document.getElementById('particles');

        for (let i = 0; i < 50; i++) {
          const particle = document.createElement('div');
          particle.className = 'particle';
          particle.textContent = particles[Math.floor(Math.random() * particles.length)];
          particle.style.left = Math.random() * 100 + '%';
          particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
          particle.style.animationDelay = Math.random() * 2 + 's';
          container.appendChild(particle);
        }
      </script>
    </body>
    </html>`;
  }

  /**
   * Get achievements HTML
   */
  private getAchievementsHTML(): string {
    const achievements = Array.from(this.achievements.values());
    const totalPoints = achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);

    const achievementCards = achievements
      .filter(a => !a.secret || a.unlocked)
      .map(a => `
        <div class="achievement ${a.unlocked ? 'unlocked' : 'locked'}">
          <div class="icon">${a.unlocked ? a.icon : '🔒'}</div>
          <div class="info">
            <div class="name">${a.name}</div>
            <div class="description">${a.description}</div>
            <div class="points">${a.points} points</div>
          </div>
        </div>
      `).join('');

    return `<!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
          padding: 20px;
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .total-points {
          font-size: 24px;
          font-weight: bold;
          color: var(--vscode-terminal-ansiYellow);
        }
        .achievements {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .achievement {
          display: flex;
          padding: 15px;
          border-radius: 10px;
          background: var(--vscode-editor-inactiveSelectionBackground);
          transition: transform 0.2s;
        }
        .achievement:hover {
          transform: translateY(-2px);
        }
        .achievement.unlocked {
          background: var(--vscode-editor-selectionBackground);
          border: 2px solid var(--vscode-terminal-ansiGreen);
        }
        .achievement.locked {
          opacity: 0.5;
        }
        .icon {
          font-size: 40px;
          margin-right: 15px;
        }
        .info {
          flex: 1;
        }
        .name {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .description {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 5px;
        }
        .points {
          font-size: 11px;
          color: var(--vscode-terminal-ansiCyan);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏆 Achievements</h1>
        <div class="total-points">Total Points: ${totalPoints}</div>
      </div>
      <div class="achievements">
        ${achievementCards}
      </div>
    </body>
    </html>`;
  }

  /**
   * Play 8-bit sound effect
   */
  private play8BitSound(): void {
    // This would play a sound if VS Code supported it
    // For now, we'll just log it
    this.logger.info('8-bit sound effect triggered');
  }

  /**
   * Load unlocked achievements from storage
   */
  private loadUnlockedAchievements(): void {
    const context = this.getExtensionContext();
    if (!context) return;

    const saved = context.globalState.get<Record<string, Achievement>>('achievements', {});

    for (const [id, data] of Object.entries(saved)) {
      const achievement = this.achievements.get(id);
      if (achievement) {
        Object.assign(achievement, data);
      }
    }
  }

  /**
   * Save achievements to storage
   */
  private saveAchievements(): void {
    const context = this.getExtensionContext();
    if (!context) return;

    const toSave: Record<string, Achievement> = {};

    for (const [id, achievement] of this.achievements) {
      if (achievement.unlocked) {
        toSave[id] = achievement;
      }
    }

    context.globalState.update('achievements', toSave);
  }

  /**
   * Get extension context
   */
  private getExtensionContext(): vscode.ExtensionContext | undefined {
    return (globalThis as any).__extensionContext;
  }

  /**
   * Check for persistent tester achievement
   */
  public checkPersistentAchievement(): void {
    const context = this.getExtensionContext();
    if (!context) return;

    const firstUse = context.globalState.get<number>('firstUseTime');

    if (!firstUse) {
      context.globalState.update('firstUseTime', Date.now());
      return;
    }

    const daysSinceFirst = (Date.now() - firstUse) / (1000 * 60 * 60 * 24);

    if (daysSinceFirst >= 30) {
      this.unlockAchievement('persistent');
    }
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}

/**
 * Productivity tips that appear randomly
 */
export class ProductivityTips {
  private tips = [
    {
      title: 'Did you know?',
      message: 'You can use Ctrl+Shift+D to quickly open Discovery Lens!'
    },
    {
      title: 'Pro tip',
      message: 'Try different AI providers to get varied test perspectives.'
    },
    {
      title: 'Efficiency boost',
      message: 'Batch scaffolding can generate tests for entire folders at once!'
    },
    {
      title: 'Power user tip',
      message: 'Custom templates in .adaptive-tests/templates/ override defaults.'
    },
    {
      title: 'Discovery trick',
      message: 'Use wildcards in discovery signatures for broader matches.'
    },
    {
      title: 'Test better',
      message: 'AI assertions adapt to your code style over time.'
    },
    {
      title: 'Speed tip',
      message: 'Local AI models with Ollama work offline and protect privacy.'
    },
    {
      title: 'Quality tip',
      message: 'Review AI-generated tests to teach the model your preferences.'
    }
  ];

  private lastTipTime = 0;
  private readonly TIP_COOLDOWN = 30 * 60 * 1000; // 30 minutes

  public showRandomTip(): void {
    const now = Date.now();

    if (now - this.lastTipTime < this.TIP_COOLDOWN) {
      return;
    }

    if (Math.random() > 0.1) { // 10% chance
      return;
    }

    const tip = this.tips[Math.floor(Math.random() * this.tips.length)];

    vscode.window.showInformationMessage(
      `💡 ${tip.title}: ${tip.message}`,
      'Got it!',
      'Don\'t show tips'
    ).then(selection => {
      if (selection === 'Don\'t show tips') {
        vscode.workspace.getConfiguration('adaptive-tests')
          .update('ui.showTips', false, vscode.ConfigurationTarget.Global);
      }
    });

    this.lastTipTime = now;
  }
}