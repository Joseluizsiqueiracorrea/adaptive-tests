/**
 * Path Validator
 * Secure path validation and resolution utilities
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { promises as fs } from 'fs';

export class PathValidator {
  /**
   * Validate and resolve a path within workspace boundaries
   */
  public static async resolveWorkspacePath(
    targetPath: string,
    workspaceFolder?: vscode.WorkspaceFolder
  ): Promise<{ absolute: string; relative: string } | null> {
    const folders = workspaceFolder
      ? [workspaceFolder]
      : vscode.workspace.workspaceFolders || [];

    for (const folder of folders) {
      const resolved = await this.resolvePathInsideRoot(folder.uri.fsPath, targetPath);
      if (resolved) {
        return resolved;
      }
    }

    return null;
  }

  /**
   * Resolve path ensuring it stays within root directory while respecting symlinks
   */
  public static async resolvePathInsideRoot(
    rootPath: string,
    targetPath: string
  ): Promise<{ absolute: string; relative: string } | null> {
    if (!targetPath) {
      return null;
    }

    const absolute = path.isAbsolute(targetPath)
      ? path.resolve(targetPath)
      : path.resolve(rootPath, targetPath);

    const relative = path.relative(rootPath, absolute);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return null;
    }

    try {
      const realAbsolute = await fs.realpath(absolute);
      const realRelative = path.relative(rootPath, realAbsolute);
      if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
        return null;
      }
    } catch (error: any) {
      // Ignore ENOENT so newly created files can still be scaffolded
      if (error?.code && error.code !== 'ENOENT') {
        throw error;
      }
    }

    return { absolute, relative };
  }

  /**
   * Validate a file path for safe operations
   */
  public static isValidFilePath(filePath: string): boolean {
    if (filePath.includes('\0')) {
      return false;
    }

    const suspiciousPatterns = [
      /\.\.[\/\\]/,  // Path traversal
      /^[\/\\]/,     // Absolute paths on Unix
      /^[a-zA-Z]:/,    // Absolute paths on Windows
      /[<>:"|?*]/,     // Invalid characters on Windows
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Sanitize a file name for safe file creation
   */
  public static sanitizeFileName(fileName: string): string {
    let sanitized = fileName
      .replace(/[\/\\]/g, '_')
      .replace(/\0/g, '')
      .replace(/[<>:"|?*]/g, '_');

    if (sanitized.length > 255) {
      const ext = path.extname(sanitized);
      const base = path.basename(sanitized, ext);
      sanitized = base.substring(0, 255 - ext.length) + ext;
    }

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
      const resolved = await this.resolvePathInsideRoot(folder.uri.fsPath, targetPath);
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

    return path.basename(absolutePath);
  }
}
