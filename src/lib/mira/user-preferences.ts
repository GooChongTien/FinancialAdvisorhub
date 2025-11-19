/**
 * Mira User Preferences System
 * Allows users to control Mira's proactive behavior and suggestions
 */

/**
 * User preferences for Mira behavior
 */
export interface MiraUserPreferences {
  // General settings
  enabled: boolean;
  proactiveMode: "aggressive" | "balanced" | "conservative" | "off";

  // Suggestion settings
  suggestions: {
    enabled: boolean;
    showToasts: boolean;
    showInlineSuggestions: boolean;
    autoExecuteSafeSuggestions: boolean;
    suggestionFrequency: "high" | "medium" | "low";
    minConfidenceThreshold: number; // 0-1
  };

  // Pattern detection
  patternDetection: {
    enabled: boolean;
    trackNavigation: boolean;
    trackFormInteractions: boolean;
    detectStruggle: boolean;
    detectSuccess: boolean;
  };

  // Notifications
  notifications: {
    enabled: boolean;
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    autoHideDuration: number; // milliseconds, 0 = manual dismiss
    playSound: boolean;
    showPatternInfo: boolean;
  };

  // Privacy
  privacy: {
    trackBehavior: boolean;
    shareAnonymousData: boolean;
    dataRetentionDays: number;
  };

  // Keyboard shortcuts
  keyboardShortcuts: {
    enabled: boolean;
    customShortcuts: Record<string, string>;
  };

  // Module-specific settings
  moduleSettings: {
    customer: { enabled: boolean };
    new_business: { enabled: boolean };
    product: { enabled: boolean };
    analytics: { enabled: boolean };
    todo: { enabled: boolean };
    broadcast: { enabled: boolean };
    visualizer: { enabled: boolean };
  };

  // Learning
  learning: {
    enabled: boolean;
    adaptToUsage: boolean;
    learnFromDismissals: boolean;
  };
}

/**
 * Default preferences
 */
export const DEFAULT_PREFERENCES: MiraUserPreferences = {
  enabled: true,
  proactiveMode: "balanced",

  suggestions: {
    enabled: true,
    showToasts: true,
    showInlineSuggestions: true,
    autoExecuteSafeSuggestions: false,
    suggestionFrequency: "medium",
    minConfidenceThreshold: 0.7,
  },

  patternDetection: {
    enabled: true,
    trackNavigation: true,
    trackFormInteractions: true,
    detectStruggle: true,
    detectSuccess: true,
  },

  notifications: {
    enabled: true,
    position: "bottom-right",
    autoHideDuration: 10000, // 10 seconds
    playSound: false,
    showPatternInfo: true,
  },

  privacy: {
    trackBehavior: true,
    shareAnonymousData: false,
    dataRetentionDays: 30,
  },

  keyboardShortcuts: {
    enabled: true,
    customShortcuts: {},
  },

  moduleSettings: {
    customer: { enabled: true },
    new_business: { enabled: true },
    product: { enabled: true },
    analytics: { enabled: true },
    todo: { enabled: true },
    broadcast: { enabled: true },
    visualizer: { enabled: true },
  },

  learning: {
    enabled: true,
    adaptToUsage: true,
    learnFromDismissals: true,
  },
};

/**
 * Preference presets
 */
export const PREFERENCE_PRESETS: Record<
  "beginner" | "intermediate" | "advanced" | "minimal",
  Partial<MiraUserPreferences>
> = {
  beginner: {
    proactiveMode: "aggressive",
    suggestions: {
      enabled: true,
      showToasts: true,
      showInlineSuggestions: true,
      autoExecuteSafeSuggestions: false,
      suggestionFrequency: "high",
      minConfidenceThreshold: 0.6,
    },
    notifications: {
      enabled: true,
      position: "bottom-right",
      autoHideDuration: 15000,
      playSound: false,
      showPatternInfo: true,
    },
  },

  intermediate: {
    proactiveMode: "balanced",
    suggestions: {
      enabled: true,
      showToasts: true,
      showInlineSuggestions: true,
      autoExecuteSafeSuggestions: false,
      suggestionFrequency: "medium",
      minConfidenceThreshold: 0.7,
    },
    notifications: {
      enabled: true,
      position: "bottom-right",
      autoHideDuration: 10000,
      playSound: false,
      showPatternInfo: true,
    },
  },

  advanced: {
    proactiveMode: "conservative",
    suggestions: {
      enabled: true,
      showToasts: false,
      showInlineSuggestions: true,
      autoExecuteSafeSuggestions: true,
      suggestionFrequency: "low",
      minConfidenceThreshold: 0.8,
    },
    notifications: {
      enabled: false,
      position: "bottom-right",
      autoHideDuration: 5000,
      playSound: false,
      showPatternInfo: false,
    },
  },

  minimal: {
    proactiveMode: "off",
    suggestions: {
      enabled: true,
      showToasts: false,
      showInlineSuggestions: false,
      autoExecuteSafeSuggestions: false,
      suggestionFrequency: "low",
      minConfidenceThreshold: 0.9,
    },
    patternDetection: {
      enabled: false,
      trackNavigation: false,
      trackFormInteractions: false,
      detectStruggle: false,
      detectSuccess: false,
    },
    notifications: {
      enabled: false,
      position: "bottom-right",
      autoHideDuration: 0,
      playSound: false,
      showPatternInfo: false,
    },
  },
};

/**
 * Mira User Preferences Manager
 * Manages user preferences with localStorage persistence
 */
export class MiraUserPreferencesManager {
  private static instance: MiraUserPreferencesManager;
  private preferences: MiraUserPreferences;
  private readonly STORAGE_KEY = "mira_user_preferences";
  private listeners: Set<(prefs: MiraUserPreferences) => void> = new Set();

  private constructor() {
    this.preferences = this.loadPreferences();
  }

  static getInstance(): MiraUserPreferencesManager {
    if (!MiraUserPreferencesManager.instance) {
      MiraUserPreferencesManager.instance = new MiraUserPreferencesManager();
    }
    return MiraUserPreferencesManager.instance;
  }

  /**
   * Get all preferences
   */
  getPreferences(): MiraUserPreferences {
    return { ...this.preferences };
  }

  /**
   * Update preferences
   */
  updatePreferences(updates: Partial<MiraUserPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...updates,
    };

    this.savePreferences();
    this.notifyListeners();
  }

  /**
   * Update specific preference section
   */
  updateSection<K extends keyof MiraUserPreferences>(
    section: K,
    updates: Partial<MiraUserPreferences[K]>
  ): void {
    this.preferences = {
      ...this.preferences,
      [section]: {
        ...this.preferences[section],
        ...updates,
      },
    };

    this.savePreferences();
    this.notifyListeners();
  }

  /**
   * Apply preset
   */
  applyPreset(preset: keyof typeof PREFERENCE_PRESETS): void {
    const presetConfig = PREFERENCE_PRESETS[preset];
    this.updatePreferences(presetConfig);
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    this.notifyListeners();
  }

  /**
   * Check if suggestion should be shown based on preferences
   */
  shouldShowSuggestion(confidence: number, module?: string): boolean {
    if (!this.preferences.enabled) return false;
    if (!this.preferences.suggestions.enabled) return false;

    // Check confidence threshold
    if (confidence < this.preferences.suggestions.minConfidenceThreshold) {
      return false;
    }

    // Check module settings
    if (module && this.preferences.moduleSettings[module as keyof typeof this.preferences.moduleSettings]) {
      return this.preferences.moduleSettings[module as keyof typeof this.preferences.moduleSettings].enabled;
    }

    return true;
  }

  /**
   * Check if proactive behavior is enabled
   */
  isProactiveEnabled(): boolean {
    return (
      this.preferences.enabled &&
      this.preferences.proactiveMode !== "off"
    );
  }

  /**
   * Get suggestion frequency delay
   */
  getSuggestionDelay(): number {
    switch (this.preferences.suggestions.suggestionFrequency) {
      case "high":
        return 5000; // 5 seconds
      case "medium":
        return 10000; // 10 seconds
      case "low":
        return 30000; // 30 seconds
      default:
        return 10000;
    }
  }

  /**
   * Subscribe to preference changes
   */
  subscribe(listener: (prefs: MiraUserPreferences) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): MiraUserPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new fields are present
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
        };
      }
    } catch (error) {
      console.error("[MiraPreferences] Failed to load preferences:", error);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
      console.debug("[MiraPreferences] Preferences saved");
    } catch (error) {
      console.error("[MiraPreferences] Failed to save preferences:", error);
    }
  }

  /**
   * Notify listeners of preference changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.getPreferences());
      } catch (error) {
        console.error("[MiraPreferences] Listener error:", error);
      }
    });
  }

  /**
   * Export preferences as JSON
   */
  exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Import preferences from JSON
   */
  importPreferences(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      this.preferences = {
        ...DEFAULT_PREFERENCES,
        ...imported,
      };
      this.savePreferences();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error("[MiraPreferences] Failed to import:", error);
      return false;
    }
  }
}

// Export singleton instance
export const miraUserPreferences = MiraUserPreferencesManager.getInstance();
