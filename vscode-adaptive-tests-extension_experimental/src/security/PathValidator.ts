/**
 * Path Validator
 * Secure path validation and resolution utilities
 */

import * as path from 'path';
import * as vscode from 'vscode';

export class PathValidator {
  /**
   * Validate and resolve a path within workspace boundaries
   */
  public static resolveWorkspacePath(
    targetPath: string,
    workspaceFolder?: vscode.WorkspaceFolder
  ): { absolute: string; relative: string } | null {
    const folders = workspaceFolder
      ? [workspaceFolder]
      : vscode.workspace.workspaceFolders || [];

    for (const folder of folders) {
      const resolved = this.resolvePathInsideRoot(folder.uri.fsPath, targetPath);
      if (resolved) {
        return resolved;
      }
    }

    return null;
  }

  /**
   * Resolve path ensuring it stays within root directory
   */
  public static resolvePathInsideRoot(
    rootPath: string,
    targetPath: string
  ): { absolute: string; relative: string } | null {
    if (!targetPath) {
      return null;
    }

    // Normalize and resolve the path
    const absolute = path.isAbsolute(targetPath)
      ? path.resolve(targetPath)
      : path.resolve(rootPath, targetPath);

    // Ensure the path is within the root
    const relative = path.relative(rootPath, absolute);

    // Check for path traversal attempts
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return null;
    }

    // Note: Symbolic link check would require async fs.realpath
    // For now, we trust VS Code's workspace boundaries

    return { absolute, relative };
  }

  /**
   * Validate a file path for safe operations
   */
  public static isValidFilePath(filePath: string): boolean {
    // Check for null bytes
    if (filePath.includes('\0')) {
      return false;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\.[\/\\]/,  // Path traversal
      /^[\/\\]/,     // Absolute paths on Unix
      /^[a-zA-Z]:/,  // Absolute paths on Windows
      /[<>:"|?*]/,   // Invalid characters on Windows
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Sanitize a file name for safe file creation
   */
  public static sanitizeFileName(fileName: string): string {
    // Remove path separators and null bytes
    let sanitized = fileName
      .replace(/[\/\\]/g, '_')
      .replace(/\0/g, '')
      .replace(/[<>:"|?*]/g, '_');

    // Limit length
    if (sanitized.length > 255) {
      const ext = path.extname(sanitized);
      const base = path.basename(sanitized, ext);
      sanitized = base.substring(0, 255 - ext.length) + ext;
    }

    // Don't allow only dots or spaces
    if (/^[\s.]+$/.test(sanitized)) {
      sanitized = 'file';
    }

    return sanitized;
  }

  /**
   * Check if a path is within any workspace folder
   */
  public static async isInWorkspace(targetPath: string): Promise<boolean> {
    const folders = vscode.workspace.workspaceFolders || [];

    for (const folder of folders) {
      const resolved = this.resolvePathInsideRoot(folder.uri.fsPath, targetPath);
      if (resolved) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get safe workspace-relative path for display
   */
  public static getDisplayPath(absolutePath: string): string {
    const folders = vscode.workspace.workspaceFolders || [];

    for (const folder of folders) {
      const relative = path.relative(folder.uri.fsPath, absolutePath);
      if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
        return relative;
      }
    }

    // If not in workspace, return just the filename
    return path.basename(absolutePath);
  }
}

/**
 * Command sanitizer for safe CLI execution
 */
export class CommandSanitizer {
  /**
   * Sanitize a command argument for shell execution
   */
  public static sanitizeArg(arg: string): string {
    // For Windows
    if (process.platform === 'win32') {
      // Escape special characters for cmd.exe
      return '"' + arg.replace(/"/g, '""') + '"';
    }

    // For Unix-like systems (Linux, macOS)
    // Use single quotes and escape single quotes
    return "'" + arg.replace(/'/g, "'\\''") + "'";
  }

  /**
   * Sanitize a JSON object for CLI usage
   */
  public static sanitizeJson(obj: any): string {
    // Remove any potentially dangerous keys
    const sanitized = this.deepSanitize(obj);
    const json = JSON.stringify(sanitized);
    return this.sanitizeArg(json);
  }

  /**
   * Deep sanitize an object removing dangerous patterns
   */
  private static deepSanitize(obj: any, depth = 0): any {
    // Prevent deep recursion
    if (depth > 10) {
      return null;
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      // Remove null bytes and limit length
      return obj.replace(/\0/g, '').substring(0, 1024);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj
        .slice(0, 100) // Limit array size
        .map(item => this.deepSanitize(item, depth + 1));
    }

    if (typeof obj === 'object') {
      const result: any = {};
      const keys = Object.keys(obj).slice(0, 50); // Limit number of keys

      for (const key of keys) {
        // Skip potentially dangerous keys
        if (this.isDangerousKey(key)) {
          continue;
        }
        result[key] = this.deepSanitize(obj[key], depth + 1);
      }

      return result;
    }

    return null;
  }

  /**
   * Check if a key name is potentially dangerous
   */
  private static isDangerousKey(key: string): boolean {
    const dangerous = [
      '__proto__',
      'constructor',
      'prototype',
      'eval',
      'Function',
      'setTimeout',
      'setInterval',
      'require',
      'import',
      'process',
      'child_process'
    ];

    return dangerous.includes(key) || key.includes('\0');
  }
}