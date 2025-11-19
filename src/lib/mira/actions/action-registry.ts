/**
 * Mira Action Registry
 * Central registry for all available actions
 */

import type { MiraAction, ActionCategory, ActionRegistryConfig } from "./types";
import { ALL_ACTION_TEMPLATES, createActionFromTemplate } from "./action-templates";

/**
 * Action Registry
 * Manages registration, lookup, and caching of actions
 */
export class ActionRegistry {
  private static instance: ActionRegistry;
  private actions: Map<string, MiraAction> = new Map();
  private cache: Map<string, MiraAction[]> = new Map();
  private usageStats: Map<string, number> = new Map();
  private config: ActionRegistryConfig = {
    enableCaching: true,
    cacheTTL: 60000, // 1 minute
    maxCacheSize: 100,
    trackUsage: true,
    enableSuggestions: true,
  };

  private constructor() {
    this.loadDefaultActions();
  }

  static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }

  /**
   * Load default actions from templates
   */
  private loadDefaultActions(): void {
    for (const template of ALL_ACTION_TEMPLATES) {
      const action = createActionFromTemplate(template.id);
      if (action) {
        this.registerAction(action);
      }
    }

    console.debug(`[ActionRegistry] Loaded ${this.actions.size} default actions`);
  }

  /**
   * Register a new action
   */
  registerAction(action: MiraAction): void {
    this.actions.set(action.id, action);
    this.clearCache(); // Invalidate cache when registry changes
  }

  /**
   * Unregister an action
   */
  unregisterAction(actionId: string): boolean {
    const removed = this.actions.delete(actionId);
    if (removed) {
      this.clearCache();
    }
    return removed;
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): MiraAction | undefined {
    const action = this.actions.get(actionId);

    if (action && this.config.trackUsage) {
      this.trackUsage(actionId);
    }

    return action;
  }

  /**
   * Get all actions
   */
  getAllActions(): MiraAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get actions by category
   */
  getActionsByCategory(category: ActionCategory): MiraAction[] {
    const cacheKey = `category:${category}`;

    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const actions = this.getAllActions().filter((a) => a.category === category);

    if (this.config.enableCaching) {
      this.cache.set(cacheKey, actions);
    }

    return actions;
  }

  /**
   * Get actions by tag
   */
  getActionsByTag(tag: string): MiraAction[] {
    const cacheKey = `tag:${tag}`;

    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const actions = this.getAllActions().filter((a) => a.tags?.includes(tag));

    if (this.config.enableCaching) {
      this.cache.set(cacheKey, actions);
    }

    return actions;
  }

  /**
   * Search actions
   */
  searchActions(query: string): MiraAction[] {
    const lowerQuery = query.toLowerCase();

    return this.getAllActions().filter((action) => {
      return (
        action.name.toLowerCase().includes(lowerQuery) ||
        action.description.toLowerCase().includes(lowerQuery) ||
        action.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * Get actions with keyboard shortcuts
   */
  getActionsByShortcut(shortcut: string): MiraAction[] {
    return this.getAllActions().filter((a) => a.keyboard_shortcut === shortcut);
  }

  /**
   * Get all keyboard shortcuts
   */
  getAllShortcuts(): Map<string, MiraAction> {
    const shortcuts = new Map<string, MiraAction>();

    for (const action of this.actions.values()) {
      if (action.keyboard_shortcut) {
        shortcuts.set(action.keyboard_shortcut, action);
      }
    }

    return shortcuts;
  }

  /**
   * Get most used actions
   */
  getMostUsedActions(limit: number = 10): MiraAction[] {
    if (!this.config.trackUsage) {
      return [];
    }

    const sorted = Array.from(this.usageStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted
      .map(([actionId]) => this.getAction(actionId))
      .filter((a): a is MiraAction => a !== undefined);
  }

  /**
   * Get recently used actions
   */
  getRecentActions(limit: number = 5): MiraAction[] {
    // This would typically track timestamps, for now return most used
    return this.getMostUsedActions(limit);
  }

  /**
   * Track action usage
   */
  private trackUsage(actionId: string): void {
    const currentCount = this.usageStats.get(actionId) || 0;
    this.usageStats.set(actionId, currentCount + 1);
  }

  /**
   * Get usage stats
   */
  getUsageStats(): Map<string, number> {
    return new Map(this.usageStats);
  }

  /**
   * Clear cache
   */
  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ActionRegistryConfig>): void {
    this.config = { ...this.config, ...config };

    if (!config.enableCaching) {
      this.clearCache();
    }
  }

  /**
   * Get configuration
   */
  getConfig(): ActionRegistryConfig {
    return { ...this.config };
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalActions: number;
    actionsByCategory: Record<string, number>;
    actionsWithShortcuts: number;
    cacheSize: number;
    totalUsage: number;
  } {
    const actionsByCategory: Record<string, number> = {};

    for (const action of this.actions.values()) {
      actionsByCategory[action.category] =
        (actionsByCategory[action.category] || 0) + 1;
    }

    return {
      totalActions: this.actions.size,
      actionsByCategory,
      actionsWithShortcuts: Array.from(this.actions.values()).filter(
        (a) => a.keyboard_shortcut
      ).length,
      cacheSize: this.cache.size,
      totalUsage: Array.from(this.usageStats.values()).reduce((sum, count) => sum + count, 0),
    };
  }
}

// Export singleton instance
export const actionRegistry = ActionRegistry.getInstance();
