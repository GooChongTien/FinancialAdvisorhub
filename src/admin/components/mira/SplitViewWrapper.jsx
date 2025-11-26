/**
 * SplitViewWrapper - Global Mira Split View Manager
 *
 * Wraps the entire app and shows split view when mode is 'split'
 * Handles keyboard shortcuts and state management
 */

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SplitViewContainer } from './SplitViewContainer.jsx';
import InlineChatPanel from './InlineChatPanel.jsx';
import { useMiraMode } from '@/admin/state/useMiraMode.ts';

export function SplitViewWrapper({ children }) {
  const { mode, openSplit, close, conversationId } = useMiraMode();
  const location = useLocation();
  const isSplitMode = mode === 'split';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+K / Ctrl+K: Toggle split view
      if (ctrlOrCmd && e.key === 'k') {
        e.preventDefault();
        if (isSplitMode) {
          close();
        } else {
          openSplit(conversationId);
        }
      }

      // Escape: Close split view
      if (e.key === 'Escape' && isSplitMode) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSplitMode, openSplit, close, conversationId]);

  // Auto-collapse sidebar when split view opens
  useEffect(() => {
    if (isSplitMode) {
      window.dispatchEvent(new CustomEvent('mira:auto-collapse-sidebar'));
    }
  }, [isSplitMode]);

  // Don't show split view on ChatMira page (avoid nested chat)
  const isChatPage = location.pathname.includes('/chat-mira') || location.pathname.includes('/chat');

  if (isSplitMode && !isChatPage) {
    return (
      <SplitViewContainer
        isOpen={true}
        onClose={close}
        chatPanel={<InlineChatPanel showHeader={false} />}
        contentPanel={children}
      />
    );
  }

  return children;
}
