/**
 * Discovery Lens Component
 * High-performance UI with virtual scrolling and real-time updates
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useVSCode } from '../contexts/VSCodeContext';
import { useDiscoveryStore } from '../stores/discoveryStore';
import { SignatureEditor } from './SignatureEditor';
import { ResultCard } from './ResultCard';
import { FilterBar } from './FilterBar';
import { PerformanceMonitor } from './PerformanceMonitor';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { LiquidGlassPanel } from './LiquidGlassPanel';
import type { DiscoveryResult, DiscoverySignature } from '../types';
import toast from 'react-hot-toast';

export const DiscoveryLens: React.FC = () => {
  const vscode = useVSCode();
  const {
    signature,
    setSignature,
    results,
    setResults,
    filters,
    isLoading,
    setLoading
  } = useDiscoveryStore();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<List>(null);
  const { ref: bottomRef, inView: bottomInView } = useInView();

  // Motion values for liquid glass effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

  // Track mouse position for liquid glass effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
  const discoveryMutation = useMutation({
    mutationFn: async (sig: DiscoverySignature) => {
      setLoading(true);
      return vscode.postMessage({
        command: 'runDiscovery',
        signature: sig
      });
    },
    onSuccess: (data) => {
      setResults(data as DiscoveryResult[]);
      setLoading(false);
      toast.success(`Found ${data.length} results`, {
        icon: '🎯'
      });
    },
    onError: (error) => {
      setLoading(false);
      toast.error(`Discovery failed: ${error}`, {
        icon: '❌'
      });
    }
  });

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
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
      filtered = filtered.filter(r =>
        r.path.toLowerCase().includes(term) ||
        r.relativePath?.toLowerCase().includes(term)
      );
    }

    // Sort by score
    if (filters.sortBy === 'score') {
      filtered.sort((a, b) => b.score - a.score);
    } else if (filters.sortBy === 'path') {
      filtered.sort((a, b) => a.relativePath?.localeCompare(b.relativePath || '') || 0);
    }

    return filtered;
  }, [results, filters]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredResults.length - 1));
      listRef.current?.scrollToItem(selectedIndex + 1, 'smart');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
      listRef.current?.scrollToItem(selectedIndex - 1, 'smart');
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      vscode.postMessage({
        command: 'openFile',
        path: filteredResults[selectedIndex].path
      });
    }
  }, [selectedIndex, filteredResults, vscode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Virtual list row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const result = filteredResults[index];
    const isSelected = index === selectedIndex;

    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02, duration: 0.3 }}
      >
        <ResultCard
          result={result}
          isSelected={isSelected}
          onClick={() => setSelectedIndex(index)}
          onDoubleClick={() => {
            vscode.postMessage({
              command: 'openFile',
              path: result.path
            });
          }}
        />
      </motion.div>
    );
  }, [filteredResults, selectedIndex, vscode]);

  const handleRunDiscovery = useCallback(() => {
    if (signature?.name) {
      discoveryMutation.mutate(signature);
    } else {
      toast.error('Please provide a signature name');
    }
  }, [signature, discoveryMutation]);

  return (
    <div className="discovery-lens-container">
      <motion.div
        className="glass-header"
        style={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <LiquidGlassPanel className="header-panel">
          <h1 className="lens-title">
            <span className="lens-icon">🔍</span>
            Discovery Lens
          </h1>
          <p className="lens-subtitle">
            AI-powered code discovery with adaptive intelligence
          </p>
        </LiquidGlassPanel>
      </motion.div>

      <div className="lens-content">
        <LiquidGlassPanel className="input-panel">
          <SignatureEditor
            signature={signature}
            onChange={setSignature}
            onSubmit={handleRunDiscovery}
            isLoading={isLoading}
          />
        </LiquidGlassPanel>

        {filteredResults.length > 0 && (
          <LiquidGlassPanel className="filter-panel">
            <FilterBar />
          </LiquidGlassPanel>
        )}

        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="loading-state"
            >
              <LiquidGlassPanel className="loading-panel">
                <div className="loading-spinner" />
                <p>Discovering code patterns...</p>
                <PerformanceMonitor />
              </LiquidGlassPanel>
            </motion.div>
          )}

          {!isLoading && filteredResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="results-container"
            >
              <LiquidGlassPanel className="results-panel">
                <div className="results-header">
                  <h2>
                    {filteredResults.length} {filteredResults.length === 1 ? 'Result' : 'Results'}
                  </h2>
                  <div className="results-actions">
                    <button
                      className="action-button"
                      onClick={() => {
                        vscode.postMessage({
                          command: 'exportResults',
                          results: filteredResults
                        });
                      }}
                    >
                      Export
                    </button>
                  </div>
                </div>

                <List
                  ref={listRef}
                  height={600}
                  itemCount={filteredResults.length}
                  itemSize={120}
                  width="100%"
                  className="virtual-list"
                  overscanCount={5}
                >
                  {Row}
                </List>

                {/* Load more indicator */}
                <div ref={bottomRef} className="load-more">
                  {bottomInView && filteredResults.length > 50 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="load-more-text"
                    >
                      Showing all results
                    </motion.div>
                  )}
                </div>
              </LiquidGlassPanel>
            </motion.div>
          )}

          {!isLoading && filteredResults.length === 0 && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="no-results"
            >
              <LiquidGlassPanel>
                <p>No results match your filters</p>
                <button onClick={() => useDiscoveryStore.getState().resetFilters()}>
                  Clear Filters
                </button>
              </LiquidGlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <KeyboardShortcuts />
    </div>
  );
};