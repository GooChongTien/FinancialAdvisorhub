/**
 * SplitViewContainer - Mira Split View Layout
 *
 * Displays chat panel on left (30%) and module content on right (70%)
 * Features:
 * - Resizable divider (20-50% range)
 * - Keyboard shortcuts (Cmd+K/Ctrl+K to toggle)
 * - Smooth animations
 * - Persisted preferences
 */

import { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, GripVertical, Navigation } from 'lucide-react';
import clsx from 'clsx';
import { useMiraMode } from '@/admin/state/useMiraMode';

export function SplitViewContainer({ chatPanel, contentPanel, isOpen, onClose }) {
  const { autoNavEnabled, toggleAutoNav } = useMiraMode();
  const [chatWidth, setChatWidth] = useState(() => {
    // Load from localStorage or default to 30%
    const saved = localStorage.getItem('mira-split-view-width');
    return saved ? parseInt(saved, 10) : 30;
  });
  const [isFullWidth, setIsFullWidth] = useState(false);
  const isDragging = useRef(false);
  const containerRef = useRef(null);

  // Save width preference
  useEffect(() => {
    localStorage.setItem('mira-split-view-width', chatWidth.toString());
  }, [chatWidth]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain between 20% and 50%
    if (newWidth >= 20 && newWidth <= 50) {
      setChatWidth(Math.round(newWidth));
    }
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  const toggleFullWidth = () => {
    setIsFullWidth(!isFullWidth);
  };

  // If not open, just show content
  if (!isOpen) {
    return <div className="flex-1">{contentPanel}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="flex h-screen overflow-hidden bg-slate-50"
    >
      {/* Chat Panel */}
      <div
        style={{
          width: isFullWidth ? '100%' : `${chatWidth}%`,
          minWidth: isFullWidth ? '100%' : '280px',
        }}
        className={clsx(
          'flex flex-col bg-white border-r border-slate-200 shadow-lg',
          'transition-all duration-300 ease-in-out',
          isFullWidth && 'absolute inset-0 z-50'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="font-semibold text-slate-900">Mira Co-pilot</h2>
            </div>

            {/* Auto Nav Toggle */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-300">
              <span className="text-xs text-slate-600 font-medium">Auto Nav</span>
              <button
                onClick={toggleAutoNav}
                className={clsx(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  autoNavEnabled ? 'bg-blue-600' : 'bg-slate-300'
                )}
                title={autoNavEnabled ? 'Auto navigation enabled - Mira can navigate pages' : 'Auto navigation disabled - Stay on current page'}
                aria-label={`Auto navigation ${autoNavEnabled ? 'enabled' : 'disabled'}`}
              >
                <span
                  className={clsx(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    autoNavEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
              {autoNavEnabled && (
                <Navigation className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleFullWidth}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-white rounded transition-colors"
              title={isFullWidth ? 'Exit full width' : 'Full width'}
            >
              {isFullWidth ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-white rounded transition-colors"
              title="Close split view (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          {chatPanel}
        </div>
      </div>

      {/* Resizer - Only show when not full width */}
      {!isFullWidth && (
        <div
          className={clsx(
            'relative w-1 bg-slate-200 cursor-col-resize group',
            'hover:bg-blue-500 transition-colors',
            isDragging.current && 'bg-blue-500'
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      )}

      {/* Content Panel - Only show when not full width */}
      {!isFullWidth && (
        <div
          style={{ width: `${100 - chatWidth}%` }}
          className="flex-1 overflow-auto bg-white"
        >
          {contentPanel}
        </div>
      )}
    </div>
  );
}
