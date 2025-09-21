"use strict";
/**
 * Discovery Lens Component
 * High-performance UI with virtual scrolling and real-time updates
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryLens = void 0;
const react_1 = __importStar(require("react"));
const react_window_1 = require("react-window");
const framer_motion_1 = require("framer-motion");
const react_query_1 = require("@tanstack/react-query");
const react_intersection_observer_1 = require("react-intersection-observer");
const VSCodeContext_1 = require("../contexts/VSCodeContext");
const discoveryStore_1 = require("../stores/discoveryStore");
const SignatureEditor_1 = require("./SignatureEditor");
const ResultCard_1 = require("./ResultCard");
const FilterBar_1 = require("./FilterBar");
const PerformanceMonitor_1 = require("./PerformanceMonitor");
const KeyboardShortcuts_1 = require("./KeyboardShortcuts");
const LiquidGlassPanel_1 = require("./LiquidGlassPanel");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const DiscoveryLens = () => {
    const vscode = (0, VSCodeContext_1.useVSCode)();
    const { signature, setSignature, results, setResults, filters, isLoading, setLoading } = (0, discoveryStore_1.useDiscoveryStore)();
    const [selectedIndex, setSelectedIndex] = (0, react_1.useState)(0);
    const listRef = (0, react_1.useRef)(null);
    const { ref: bottomRef, inView: bottomInView } = (0, react_intersection_observer_1.useInView)();
    // Motion values for liquid glass effects
    const mouseX = (0, framer_motion_1.useMotionValue)(0);
    const mouseY = (0, framer_motion_1.useMotionValue)(0);
    const rotateX = (0, framer_motion_1.useTransform)(mouseY, [-300, 300], [15, -15]);
    const rotateY = (0, framer_motion_1.useTransform)(mouseX, [-300, 300], [-15, 15]);
    // Track mouse position for liquid glass effects
    (0, react_1.useEffect)(() => {
        const handleMouseMove = (e) => {
            const rect = document.body.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            mouseX.set(x);
            mouseY.set(y);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);
    // Discovery query
    const discoveryMutation = (0, react_query_1.useMutation)({
        mutationFn: async (sig) => {
            setLoading(true);
            return vscode.postMessage({
                command: 'runDiscovery',
                signature: sig
            });
        },
        onSuccess: (data) => {
            setResults(data);
            setLoading(false);
            react_hot_toast_1.default.success(`Found ${data.length} results`, {
                icon: '🎯'
            });
        },
        onError: (error) => {
            setLoading(false);
            react_hot_toast_1.default.error(`Discovery failed: ${error}`, {
                icon: '❌'
            });
        }
    });
    // Filtered and sorted results
    const filteredResults = (0, react_1.useMemo)(() => {
        let filtered = [...results];
        // Apply filters
        if (filters.language) {
            filtered = filtered.filter(r => r.language === filters.language);
        }
        if (filters.minScore) {
            filtered = filtered.filter(r => r.score >= filters.minScore);
        }
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(r => r.path.toLowerCase().includes(term) ||
                r.relativePath?.toLowerCase().includes(term));
        }
        // Sort by score
        if (filters.sortBy === 'score') {
            filtered.sort((a, b) => b.score - a.score);
        }
        else if (filters.sortBy === 'path') {
            filtered.sort((a, b) => a.relativePath?.localeCompare(b.relativePath || '') || 0);
        }
        return filtered;
    }, [results, filters]);
    // Handle keyboard navigation
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, filteredResults.length - 1));
            listRef.current?.scrollToItem(selectedIndex + 1, 'smart');
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
            listRef.current?.scrollToItem(selectedIndex - 1, 'smart');
        }
        else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
            vscode.postMessage({
                command: 'openFile',
                path: filteredResults[selectedIndex].path
            });
        }
    }, [selectedIndex, filteredResults, vscode]);
    (0, react_1.useEffect)(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    // Virtual list row renderer
    const Row = (0, react_1.useCallback)(({ index, style }) => {
        const result = filteredResults[index];
        const isSelected = index === selectedIndex;
        return (<framer_motion_1.motion.div style={style} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02, duration: 0.3 }}>
        <ResultCard_1.ResultCard result={result} isSelected={isSelected} onClick={() => setSelectedIndex(index)} onDoubleClick={() => {
                vscode.postMessage({
                    command: 'openFile',
                    path: result.path
                });
            }}/>
      </framer_motion_1.motion.div>);
    }, [filteredResults, selectedIndex, vscode]);
    const handleRunDiscovery = (0, react_1.useCallback)(() => {
        if (signature?.name) {
            discoveryMutation.mutate(signature);
        }
        else {
            react_hot_toast_1.default.error('Please provide a signature name');
        }
    }, [signature, discoveryMutation]);
    return (<div className="discovery-lens-container">
      <framer_motion_1.motion.div className="glass-header" style={{ rotateX, rotateY }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
        <LiquidGlassPanel_1.LiquidGlassPanel className="header-panel">
          <h1 className="lens-title">
            <span className="lens-icon">🔍</span>
            Discovery Lens
          </h1>
          <p className="lens-subtitle">
            AI-powered code discovery with adaptive intelligence
          </p>
        </LiquidGlassPanel_1.LiquidGlassPanel>
      </framer_motion_1.motion.div>

      <div className="lens-content">
        <LiquidGlassPanel_1.LiquidGlassPanel className="input-panel">
          <SignatureEditor_1.SignatureEditor signature={signature} onChange={setSignature} onSubmit={handleRunDiscovery} isLoading={isLoading}/>
        </LiquidGlassPanel_1.LiquidGlassPanel>

        {filteredResults.length > 0 && (<LiquidGlassPanel_1.LiquidGlassPanel className="filter-panel">
            <FilterBar_1.FilterBar />
          </LiquidGlassPanel_1.LiquidGlassPanel>)}

        <framer_motion_1.AnimatePresence mode="wait">
          {isLoading && (<framer_motion_1.motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="loading-state">
              <LiquidGlassPanel_1.LiquidGlassPanel className="loading-panel">
                <div className="loading-spinner"/>
                <p>Discovering code patterns...</p>
                <PerformanceMonitor_1.PerformanceMonitor />
              </LiquidGlassPanel_1.LiquidGlassPanel>
            </framer_motion_1.motion.div>)}

          {!isLoading && filteredResults.length > 0 && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="results-container">
              <LiquidGlassPanel_1.LiquidGlassPanel className="results-panel">
                <div className="results-header">
                  <h2>
                    {filteredResults.length} {filteredResults.length === 1 ? 'Result' : 'Results'}
                  </h2>
                  <div className="results-actions">
                    <button className="action-button" onClick={() => {
                vscode.postMessage({
                    command: 'exportResults',
                    results: filteredResults
                });
            }}>
                      Export
                    </button>
                  </div>
                </div>

                <react_window_1.FixedSizeList ref={listRef} height={600} itemCount={filteredResults.length} itemSize={120} width="100%" className="virtual-list" overscanCount={5}>
                  {Row}
                </react_window_1.FixedSizeList>

                {/* Load more indicator */}
                <div ref={bottomRef} className="load-more">
                  {bottomInView && filteredResults.length > 50 && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="load-more-text">
                      Showing all results
                    </framer_motion_1.motion.div>)}
                </div>
              </LiquidGlassPanel_1.LiquidGlassPanel>
            </framer_motion_1.motion.div>)}

          {!isLoading && filteredResults.length === 0 && results.length > 0 && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="no-results">
              <LiquidGlassPanel_1.LiquidGlassPanel>
                <p>No results match your filters</p>
                <button onClick={() => discoveryStore_1.useDiscoveryStore.getState().resetFilters()}>
                  Clear Filters
                </button>
              </LiquidGlassPanel_1.LiquidGlassPanel>
            </framer_motion_1.motion.div>)}
        </framer_motion_1.AnimatePresence>
      </div>

      <KeyboardShortcuts_1.KeyboardShortcuts />
    </div>);
};
exports.DiscoveryLens = DiscoveryLens;
//# sourceMappingURL=DiscoveryLens.js.map