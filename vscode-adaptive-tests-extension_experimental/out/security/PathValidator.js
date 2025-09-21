"use strict";
/**
 * Path Validator
 * Secure path validation and resolution utilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandSanitizer = exports.PathValidator = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class PathValidator {
    /**
     * Validate and resolve a path within workspace boundaries
     */
    static resolveWorkspacePath(targetPath, workspaceFolder) {
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
    static resolvePathInsideRoot(rootPath, targetPath) {
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
        // Additional check for symbolic links
        try {
            const realPath = require('fs').realpathSync(absolute);
            const realRelative = path.relative(rootPath, realPath);
            if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
                return null;
            }
        }
        catch {
            // File doesn't exist yet, which is okay for new files
        }
        return { absolute, relative };
    }
    /**
     * Validate a file path for safe operations
     */
    static isValidFilePath(filePath) {
        // Check for null bytes
        if (filePath.includes('\0')) {
            return false;
        }
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /\.\.[\/\\]/, // Path traversal
            /^[\/\\]/, // Absolute paths on Unix
            /^[a-zA-Z]:/, // Absolute paths on Windows
            /[<>:"|?*]/, // Invalid characters on Windows
        ];
        return !suspiciousPatterns.some(pattern => pattern.test(filePath));
    }
    /**
     * Sanitize a file name for safe file creation
     */
    static sanitizeFileName(fileName) {
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
    static async isInWorkspace(targetPath) {
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
    static getDisplayPath(absolutePath) {
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
exports.PathValidator = PathValidator;
/**
 * Command sanitizer for safe CLI execution
 */
class CommandSanitizer {
    /**
     * Sanitize a command argument for shell execution
     */
    static sanitizeArg(arg) {
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
    static sanitizeJson(obj) {
        // Remove any potentially dangerous keys
        const sanitized = this.deepSanitize(obj);
        const json = JSON.stringify(sanitized);
        return this.sanitizeArg(json);
    }
    /**
     * Deep sanitize an object removing dangerous patterns
     */
    static deepSanitize(obj, depth = 0) {
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
            const result = {};
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
    static isDangerousKey(key) {
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
exports.CommandSanitizer = CommandSanitizer;
//# sourceMappingURL=PathValidator.js.map