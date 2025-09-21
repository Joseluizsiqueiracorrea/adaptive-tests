"use strict";
/**
 * Discovery Lens React App
 * Premium UI with Liquid Glass design system and virtual scrolling
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
exports.App = void 0;
const react_1 = __importStar(require("react"));
const react_query_1 = require("@tanstack/react-query");
const react_hot_toast_1 = require("react-hot-toast");
const DiscoveryLens_1 = require("./components/DiscoveryLens");
const ThemeContext_1 = require("./contexts/ThemeContext");
const VSCodeContext_1 = require("./contexts/VSCodeContext");
const ErrorBoundary_1 = require("./components/ErrorBoundary");
const LoadingScreen_1 = require("./components/LoadingScreen");
require("./styles/globals.css");
require("./styles/liquid-glass.css");
const queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false
        }
    }
});
const App = () => {
    return (<ErrorBoundary_1.ErrorBoundary>
      <react_query_1.QueryClientProvider client={queryClient}>
        <ThemeContext_1.ThemeProvider>
          <VSCodeContext_1.VSCodeProvider>
            <react_1.Suspense fallback={<LoadingScreen_1.LoadingScreen />}>
              <div className="app-container liquid-glass">
                <DiscoveryLens_1.DiscoveryLens />
                <react_hot_toast_1.Toaster position="bottom-right" toastOptions={{
            className: 'toast-notification',
            duration: 4000,
            style: {
                background: 'var(--vscode-notifications-background)',
                color: 'var(--vscode-notifications-foreground)',
                border: '1px solid var(--vscode-notifications-border)'
            }
        }}/>
              </div>
            </react_1.Suspense>
          </VSCodeContext_1.VSCodeProvider>
        </ThemeContext_1.ThemeProvider>
      </react_query_1.QueryClientProvider>
    </ErrorBoundary_1.ErrorBoundary>);
};
exports.App = App;
//# sourceMappingURL=App.js.map