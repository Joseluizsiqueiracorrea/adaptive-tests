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
exports.PathValidator = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const fs_1 = require("fs");
class PathValidator {
    /**
     * Validate and resolve a path within workspace boundaries
     */
    static async resolveWorkspacePath(targetPath, workspaceFolder) {
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
    static async resolvePathInsideRoot(rootPath, targetPath) {
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
            const realAbsolute = await fs_1.promises.realpath(absolute);
            const realRelative = path.relative(rootPath, realAbsolute);
            if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
                return null;
            }
        }
        catch (error) {
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
    static isValidFilePath(filePath) {
        if (filePath.includes('\0')) {
            return false;
        }
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
    static async isInWorkspace(targetPath) {
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
    static getDisplayPath(absolutePath) {
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
exports.PathValidator = PathValidator;
//# sourceMappingURL=PathValidator.js.map