# Documentation Style Guide

## Purpose

This guide ensures consistent, clear, and accessible documentation across the Adaptive Tests project.

## Core Principles

- **Be concrete, not abstract** - Use specific examples and avoid vague concepts
- **Focus on problems, not features** - Explain what problems you solve, not just what you do
- **Use simple language** - Avoid jargon and complex terminology
- **Show, don't tell** - Use code examples and concrete scenarios

## Terminology Standards

### Preferred Terms

| Use This | Instead Of | Why |
|-----------|------------|-----|
| "Invisible mode" | "Auto-fix import errors" | Reinforces the product name across docs |
| "Tests don't break when you move files" | "AI-ready testing infrastructure" | Specific benefit, not abstract concept |
| "Find code by understanding what it looks like" | "AST-based analysis" | Concrete explanation, not technical jargon |
| "Move files around? Tests still pass" | "Zero-runtime discovery" | Practical benefit, not technical detail |

### Feature Names

- **Invisible Mode**: For automatically fixing broken imports in existing tests
- **Simple Discovery**: For the basic `discover()` API
- **Advanced Features**: For complex configuration and tooling

### User Personas

- **Regular developers**: People who just want to fix broken tests
- **Teams**: Groups working on larger projects
- **Tool builders**: People integrating with CI/CD or IDEs

## Writing Guidelines

### Structure

1. **Start with the problem** - What pain point does this solve?
2. **Show the solution** - Concrete code examples
3. **Explain why it works** - Simple, non-technical explanation
4. **Provide next steps** - What to do after trying it

### Code Examples

- **Keep them simple** - No more than 10 lines unless necessary
- **Use realistic scenarios** - Real class names like `UserService`, not `FooBar`
- **Show before/after** - Demonstrate the improvement
- **Include comments** - Explain what each part does

### Language Rules

- **Use "you"** - Talk directly to the reader
- **Avoid marketing speak** - No "revolutionary" or "game-changing"
- **Be specific** - Use numbers and concrete examples
- **Keep sentences short** - Aim for under 20 words per sentence

## Common Pitfalls to Avoid

- ❌ "Progressive disclosure" → ✅ "Different ways to use it"
- ❌ "AI-powered teams" → ✅ "Teams that move files around"
- ❌ "Zero-effort setup" → ✅ "One command to fix broken tests"
- ❌ "Advanced patterns" → ✅ "For complex projects"

## Examples

### Good Example

```markdown
## Fix Import Errors Automatically

**Problem:** Your tests break when you move files.

**Solution:**
```bash
npx adaptive-tests enable-invisible
npm test  # ✅ Tests pass again
```

This finds your moved files automatically. No code changes needed.

### Bad Example

```markdown
## Invisible Mode (Experimental)

**AI-ready testing infrastructure** with zero-runtime discovery powered by AST analysis.

**Enable invisible mode:**
```bash
npx adaptive-tests enable-invisible
```

This provides autonomous development capabilities with deep structural signatures.