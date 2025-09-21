# Changelog

All notable changes to the Adaptive Tests VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-09-21

### Added

- 🤖 **AI-Powered Test Generation**
  - GitHub Copilot native integration
  - OpenAI GPT-4 and GPT-3.5 support
  - Anthropic Claude 3 (Opus, Sonnet, Haiku)
  - Google Gemini Pro and PaLM 2
  - Local models via Ollama (CodeLlama, StarCoder)
  - Intelligent context inclusion for better test generation
  - AI-powered assertion suggestions

- 🎨 **Liquid Glass UI Design System**
  - macOS 26 Tahoe-inspired design
  - 60fps smooth animations
  - Glassmorphism effects with backdrop filters
  - Virtual scrolling for 10,000+ results
  - React 18 with Suspense boundaries
  - Responsive and accessible design (WCAG 2.1 AA)

- 🚀 **MCP Server Architecture**
  - Model Context Protocol integration
  - Discovery server with OAuth2/API key auth
  - Resource streaming and caching
  - Language-agnostic discovery engine

- 📊 **Advanced Analytics & Telemetry**
  - Privacy-first opt-in telemetry
  - Performance metrics tracking
  - Anonymous crash reporting
  - Session analytics with aggregation
  - LRU cache with persistence

- 🎉 **Interactive Onboarding**
  - Welcome tour for new users
  - Sample workspace generation
  - Interactive feature demonstrations
  - Step-by-step configuration wizard

- ⚙️ **Dependency Injection Container**
  - IoC container with TypeScript decorators
  - Service lifecycle management
  - Lazy loading and singleton patterns
  - Clean architecture principles

- 🔧 **Configuration Service**
  - Centralized configuration management
  - Zod schema validation
  - Hot reload on config changes
  - Type-safe configuration access

### Changed

- ⚡ **Performance Optimizations**
  - Reduced activation time to < 200ms
  - Memory usage optimized to < 50MB
  - Lazy loading for all commands
  - Async I/O operations throughout
  - Cancellation token support
  - Worker threads for heavy computation

- 🔒 **Security Enhancements**
  - Command injection protection via sanitization
  - Content Security Policy (CSP) implementation
  - Secure credential storage with VS Code API
  - Input validation with Zod schemas
  - Regular dependency audits

- 📝 **TypeScript Strict Mode**
  - Enabled all strict checks
  - Removed all 'any' types
  - Comprehensive type definitions
  - Exhaustive error handling

### Fixed

- Fixed memory leaks in WebView disposal
- Fixed synchronous file operations blocking UI
- Fixed dynamic require() security vulnerability
- Fixed missing error boundaries in React components
- Fixed test failures with cancellation tokens
- Fixed CSP nonce generation issues

## [0.1.1] - 2024-12-15

### Fixed

- Fixed context menu items not appearing for certain file types
- Fixed Discovery Lens panel not refreshing after file changes
- Fixed batch scaffolding progress indicator
- Fixed CodeLens disappearing after file save

### Changed

- Improved discovery performance for large workspaces
- Enhanced error messages for better debugging
- Updated dependencies to latest versions

## [0.1.0] - 2024-12-01

### Added

- ✨ **Discovery Lens WebView Panel**
  - Visual discovery interface
  - Score-based ranking
  - Interactive results
  - Preset signatures
  - Collapsible help sections

- 📝 **Smart Scaffolding**
  - Context menu integration
  - Batch folder scaffolding
  - Auto-detection of existing tests
  - Automatic file opening after generation

- 🎯 **CodeLens Integration**
  - Inline test indicators
  - Quick action buttons
  - One-click discovery

- 📊 **Discovery Tree View**
  - Activity bar integration
  - Hierarchical result display
  - Score indicators

- 💡 **Status Bar Integration**
  - Quick access to Discovery Lens
  - Test count indicator

- 🌍 **Multi-Language Support**
  - JavaScript/TypeScript (primary)
  - Python (beta)
  - Java (beta)
  - PHP (beta)

### Configuration

- `adaptive-tests.discovery.showScores`
- `adaptive-tests.discovery.maxResults`
- `adaptive-tests.scaffold.outputDirectory`
- `adaptive-tests.scaffold.autoOpen`

## [0.0.1] - 2024-11-15

### Added

- Initial extension scaffolding
- Basic command palette integration
- Prototype Discovery Lens panel

---

## Upcoming Features (Roadmap)

### [0.3.0] - Q1 2025

- 🎮 Live Share collaborative testing
- 🐳 Dev Containers support
- 🌐 Remote development integration
- 📱 VS Code for Web support

### [0.4.0] - Q2 2025

- 🎯 Mutation testing integration
- 📈 Advanced coverage visualization
- 🔄 Continuous test generation
- 🤝 Team collaboration features

### [1.0.0] - Q3 2025

- 🏆 Production-ready release
- 📚 Comprehensive documentation
- 🌍 15+ language support
- 🚀 Enterprise features

---

For more information, visit [adaptive-tests.dev](https://adaptive-tests.dev) or check our [GitHub repository](https://github.com/anon57396/adaptive-tests).
