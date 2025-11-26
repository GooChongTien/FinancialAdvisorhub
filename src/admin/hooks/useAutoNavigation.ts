/**
 * useAutoNavigation Hook
 *
 * Handles automatic navigation based on Mira's ui_actions when Auto Nav is enabled
 * Watches for NavigateAction in message metadata and navigates accordingly
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMiraMode } from '@/admin/state/useMiraMode';
import type { UIAction, NavigateAction } from '@/lib/mira/types';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    ui_actions?: UIAction[];
    [key: string]: unknown;
  };
}

interface UseAutoNavigationOptions {
  messages: Message[];
  enabled?: boolean;
}

export function useAutoNavigation({ messages, enabled = true }: UseAutoNavigationOptions) {
  const navigate = useNavigate();
  const { autoNavEnabled } = useMiraMode();
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Skip if auto nav is disabled globally or locally
    if (!autoNavEnabled || !enabled) {
      return;
    }

    // Skip if no messages
    if (!messages || messages.length === 0) {
      return;
    }

    // Get the latest assistant message
    const latestAssistant = [...messages]
      .slice()
      .reverse()
      .find((msg) => msg.role === 'assistant' && msg.metadata?.ui_actions);

    if (!latestAssistant) {
      return;
    }

    // Skip if already processed
    if (processedMessageIds.current.has(latestAssistant.id)) {
      return;
    }

    // Mark as processed
    processedMessageIds.current.add(latestAssistant.id);

    // Extract ui_actions
    const uiActions = latestAssistant.metadata?.ui_actions || [];

    // Find navigate action
    const navigateAction = uiActions.find(
      (action): action is NavigateAction => action.action === 'navigate'
    );

    if (!navigateAction) {
      return;
    }

    // Build the navigation URL
    const url = buildNavigationUrl(navigateAction);

    if (!url) {
      console.warn('[useAutoNavigation] Could not build URL from navigate action:', navigateAction);
      return;
    }

    // Log the auto-navigation
    console.log('[useAutoNavigation] Auto-navigating to:', url);

    // Perform navigation with a small delay to ensure UI updates
    const timeoutId = setTimeout(() => {
      navigate(url);

      // Dispatch custom event for tracking
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mira:auto-nav', {
            detail: { url, action: navigateAction },
          })
        );
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [messages, autoNavEnabled, enabled, navigate]);
}

/**
 * Build navigation URL from NavigateAction
 */
function buildNavigationUrl(action: NavigateAction): string | null {
  // If target is provided, use it directly
  if (action.target) {
    return action.target;
  }

  // If params.url is provided, use it
  if (action.params && typeof action.params === 'object' && 'url' in action.params) {
    const url = action.params.url;
    if (typeof url === 'string') {
      return url;
    }
  }

  // Build URL from module and page
  if (action.module) {
    const moduleUrls: Record<string, string> = {
      customer: '/advisor/customers',
      customers: '/advisor/customers',
      new_business: '/advisor/new-business',
      product: '/advisor/product',
      products: '/advisor/product',
      analytics: '/advisor/analytics',
      todo: '/advisor/smart-plan',
      smart_plan: '/advisor/smart-plan',
      broadcast: '/advisor/broadcast',
      news: '/advisor/news',
      visualizer: '/advisor/visualizers',
      visualizers: '/advisor/visualizers',
      home: '/advisor/home',
    };

    let url = moduleUrls[action.module.toLowerCase()] || `/advisor/${action.module}`;

    // Append page if specified
    if (action.page) {
      url += `/${action.page}`;
    }

    // Append query params if specified
    if (action.params && typeof action.params === 'object') {
      const queryParams = new URLSearchParams();
      Object.entries(action.params).forEach(([key, value]) => {
        if (key !== 'url' && value != null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  return null;
}
