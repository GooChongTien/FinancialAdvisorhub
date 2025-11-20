# Enhanced Mira Co-Pilot Implementation Plan v2.0
**Version:** 2.0  
**Date:** November 16, 2025  
**Author:** CT / Claude

## Executive Summary

This enhanced implementation plan builds upon the existing Mira architecture to transform it from a reactive assistant into a **predictive, context-aware copilot** that anticipates user needs through behavioral tracking and intelligent analysis.

### Key Enhancements

1. **Behavioral Context System** - Tracks user navigation and actions to build rich context
2. **Predictive Intelligence** - Anticipates user needs based on current context and patterns
3. **Proactive Assistance** - Offers help before users ask, reducing friction
4. **Learning Engine** - Improves suggestions based on successful patterns

## Current State Analysis

### Existing Limitations

Based on your observations:

1. **Lack of Context Awareness** - Mira doesn't automatically know which screen the user is viewing
2. **Reactive Nature** - Only responds when explicitly asked
3. **No Navigation Memory** - Doesn't track user journey through the system
4. **Manual Context Description** - Users must re-describe their needs on each page

### Opportunities

Your click-tracking proposal addresses these limitations by:
- Creating persistent awareness of user location and journey
- Enabling predictive suggestions based on current context
- Building a learning system that improves over time

## Enhanced Architecture

### 1. Behavioral Context Tracking System

```typescript
// New context tracking layer
interface BehavioralContext {
  // Current state
  currentPage: string;
  currentModule: string;
  pageData: Record<string, any>;
  
  // Navigation history
  navigationHistory: NavigationEvent[];
  
  // User actions
  recentActions: UserAction[];
  
  // Session data
  sessionId: string;
  sessionStartTime: Date;
  
  // Derived insights
  userIntent: string | null;
  suggestedActions: SuggestedAction[];
  confidenceLevel: number;
}

interface NavigationEvent {
  timestamp: Date;
  fromPage: string;
  toPage: string;
  module: string;
  trigger: 'click' | 'mira' | 'direct' | 'back';
  timeSpent: number;
}

interface UserAction {
  timestamp: Date;
  actionType: 'click' | 'form_input' | 'scroll' | 'hover' | 'search';
  elementId?: string;
  elementType?: string;
  value?: any;
  context: Record<string, any>;
}
```

### 2. Client-Side Click Tracker

```typescript
// src/lib/mira/behavioral-tracker.ts
export class BehavioralTracker {
  private static instance: BehavioralTracker;
  private history: NavigationEvent[] = [];
  private actions: UserAction[] = [];
  private currentPageStart: Date;
  
  track(event: Event) {
    const action: UserAction = {
      timestamp: new Date(),
      actionType: this.classifyAction(event),
      elementId: (event.target as HTMLElement)?.id,
      elementType: (event.target as HTMLElement)?.tagName,
      value: this.extractValue(event),
      context: this.extractContext()
    };
    
    this.actions.push(action);
    this.analyzePattern();
    this.updateMiraContext(action);
  }
  
  private classifyAction(event: Event): UserAction['actionType'] {
    switch(event.type) {
      case 'click': return 'click';
      case 'input': 
      case 'change': return 'form_input';
      case 'scroll': return 'scroll';
      case 'mouseover': return 'hover';
      default: return 'click';
    }
  }
  
  private analyzePattern() {
    // Detect common patterns
    const patterns = {
      'searching_for_customer': this.detectCustomerSearch(),
      'creating_proposal': this.detectProposalCreation(),
      'reviewing_analytics': this.detectAnalyticsReview(),
      'stuck_on_form': this.detectFormStruggle()
    };
    
    // Update Mira's understanding
    if (patterns.searching_for_customer) {
      MiraContextEngine.suggest({
        intent: 'help_find_customer',
        confidence: 0.85
      });
    }
  }
  
  private detectFormStruggle(): boolean {
    // User spending >2 min on same form without submission
    const formActions = this.actions
      .filter(a => a.actionType === 'form_input')
      .filter(a => Date.now() - a.timestamp.getTime() < 120000);
      
    return formActions.length > 10 && !this.hasFormSubmission();
  }
}
```

### 3. Enhanced Context Engine

```typescript
// src/lib/mira/context-engine.ts
export class MiraContextEngine {
  private behavioralData: BehavioralContext;
  private patterns: LearnedPattern[] = [];
  
  async updateContext(action: UserAction) {
    // Update behavioral context
    this.behavioralData.recentActions.push(action);
    
    // Analyze intent
    const intent = await this.predictIntent();
    
    // Generate proactive suggestions
    const suggestions = await this.generateSuggestions(intent);
    
    // Update UI
    this.broadcastUpdate({
      intent,
      suggestions,
      confidence: this.calculateConfidence()
    });
  }
  
  private async predictIntent(): Promise<UserIntent> {
    const context = {
      currentPage: this.behavioralData.currentPage,
      recentActions: this.behavioralData.recentActions.slice(-10),
      timeOnPage: Date.now() - this.behavioralData.currentPageStart,
      navigationPath: this.getNavigationPath()
    };
    
    // Use ML/heuristics to predict intent
    return this.intentPredictor.predict(context);
  }
  
  private getNavigationPath(): string[] {
    return this.behavioralData.navigationHistory
      .slice(-5)
      .map(n => `${n.module}/${n.toPage}`);
  }
}
```

### 4. Proactive Mira Assistant

```typescript
// Enhanced Mira response with behavioral awareness
interface EnhancedMiraResponse extends MiraResponse {
  behavioral_insights: {
    detected_pattern: string | null;
    journey_stage: string;
    struggle_indicators: string[];
    success_probability: number;
  };
  
  proactive_suggestions: Array<{
    trigger: 'immediate' | 'after_delay' | 'on_idle';
    message: string;
    actions: UIAction[];
    relevance_score: number;
  }>;
  
  contextual_help: {
    current_task_completion: number;
    next_likely_steps: string[];
    common_issues_here: string[];
  };
}
```

## Implementation Phases

### Phase A: Behavioral Tracking Foundation (Week 1)

#### Objectives
- Implement client-side tracking infrastructure
- Create behavioral context schema
- Set up data pipeline to Mira

#### Tasks

**1. Create Behavioral Tracking Service**
- [ ] Implement `BehavioralTracker` class
- [ ] Add event listeners for clicks, inputs, navigation
- [ ] Create action classification logic
- [ ] Implement data sanitization for privacy

**2. Extend Context Provider**
- [ ] Add behavioral data to `MiraContext`
- [ ] Create history management (last 50 actions)
- [ ] Implement context serialization
- [ ] Add privacy controls (opt-in/out)

**3. Create Analytics Pipeline**
- [ ] Design `mira_behavioral_events` table
- [ ] Implement batch upload (every 30 seconds)
- [ ] Add data retention policies (30 days)
- [ ] Create privacy-compliant storage

**4. Update Backend Integration**
- [ ] Modify `/agent-chat` to accept behavioral context
- [ ] Update intent router to use behavioral signals
- [ ] Add behavioral scoring to confidence calculation
- [ ] Create pattern matching algorithms

### Phase B: Pattern Recognition Engine (Week 2)

#### Objectives
- Build pattern detection algorithms
- Create success/failure pattern library
- Implement real-time pattern matching

#### Tasks

**1. Pattern Detection Algorithms**
- [ ] Implement common workflow detectors
- [ ] Create struggle detection (form abandonment, back navigation)
- [ ] Build success pattern recognition
- [ ] Add time-based pattern analysis

**2. Pattern Library**
- [ ] Catalog successful customer journeys
- [ ] Document common failure points
- [ ] Create pattern templates
- [ ] Build pattern matching engine

**3. Real-time Analysis**
- [ ] Implement streaming pattern detection
- [ ] Create alert system for struggle detection
- [ ] Build confidence scoring for patterns
- [ ] Add pattern caching for performance

### Phase C: Predictive Intelligence (Week 3)

#### Objectives
- Implement intent prediction
- Create proactive suggestion engine
- Build learning feedback loop

#### Tasks

**1. Intent Prediction Model**
- [ ] Create feature extraction from behavioral data
- [ ] Implement intent prediction algorithm
- [ ] Add confidence scoring
- [ ] Create fallback heuristics

**2. Proactive Suggestion Engine**
- [ ] Build suggestion generation logic
- [ ] Implement trigger conditions
- [ ] Create relevance scoring
- [ ] Add suggestion timing logic

**3. Learning System**
- [ ] Track suggestion acceptance/rejection
- [ ] Implement feedback collection
- [ ] Create model updating pipeline
- [ ] Build A/B testing framework

### Phase D: Enhanced UI Integration (Week 4)

#### Objectives
- Create proactive UI elements
- Implement smart notifications
- Build contextual help system

#### Tasks

**1. Proactive UI Components**
- [ ] Create `ProactiveSuggestionToast` component
- [ ] Build `ContextualHelpPanel` 
- [ ] Implement `SmartTooltips`
- [ ] Add `JourneyProgressIndicator`

**2. Smart Notifications**
- [ ] Implement non-intrusive suggestion display
- [ ] Create timing algorithms (don't interrupt)
- [ ] Build dismissal tracking
- [ ] Add suggestion queuing

**3. Contextual Help**
- [ ] Create dynamic help content
- [ ] Build context-aware tooltips
- [ ] Implement inline guidance
- [ ] Add video help triggers

## Technical Implementation Details

### 1. Privacy-First Design

```typescript
// Privacy configuration
interface PrivacySettings {
  trackingEnabled: boolean;
  trackClickEvents: boolean;
  trackFormInputs: boolean; // Only track interaction, not values
  trackNavigationTime: boolean;
  shareWithMira: boolean;
  dataRetentionDays: number;
}

// Sanitization
class DataSanitizer {
  static sanitizeFormData(event: Event): SanitizedData {
    // Never track actual values for sensitive fields
    const sensitiveFields = ['password', 'nric', 'income', 'medical'];
    const fieldName = (event.target as HTMLInputElement)?.name;
    
    if (sensitiveFields.some(f => fieldName?.includes(f))) {
      return {
        field: fieldName,
        action: 'interaction',
        value: '[REDACTED]'
      };
    }
    
    return {
      field: fieldName,
      action: 'interaction',
      valueLength: (event.target as HTMLInputElement)?.value?.length
    };
  }
}
```

### 2. Performance Optimization

```typescript
// Debounced tracking to prevent performance issues
class OptimizedTracker {
  private actionQueue: UserAction[] = [];
  private batchTimer: NodeJS.Timeout;
  
  track(action: UserAction) {
    this.actionQueue.push(action);
    
    // Batch process every 100ms
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
        this.batchTimer = null;
      }, 100);
    }
  }
  
  private processBatch() {
    // Process actions in batch
    const actions = [...this.actionQueue];
    this.actionQueue = [];
    
    // Compress similar actions
    const compressed = this.compressActions(actions);
    
    // Update context
    MiraContextEngine.updateBatch(compressed);
  }
}
```

### 3. Smart Trigger System

```typescript
// Intelligent triggering to avoid annoying users
class ProactiveTriggerManager {
  private userState = {
    isTyping: false,
    isReading: false,
    lastInteraction: Date.now(),
    frustrationLevel: 0
  };
  
  shouldShowSuggestion(suggestion: ProactiveSuggestion): boolean {
    // Don't interrupt active work
    if (this.userState.isTyping) return false;
    
    // Wait for pause in activity
    const idleTime = Date.now() - this.userState.lastInteraction;
    if (idleTime < 3000) return false; // Wait 3 seconds
    
    // Check relevance threshold
    if (suggestion.relevance_score < 0.7) return false;
    
    // Throttle suggestions
    if (this.recentSuggestionCount() > 2) return false;
    
    return true;
  }
}
```

## Example Scenarios

### Scenario 1: Proposal Creation Flow

```typescript
// User navigates: Customers → Customer Detail → New Business
// Mira detects pattern and proactively offers help

// Behavioral Context
{
  navigationHistory: [
    { from: '/customers', to: '/customer/123', time: 1000 },
    { from: '/customer/123', to: '/new-business', time: 500 }
  ],
  currentPage: '/new-business',
  pageData: { customerId: '123', stage: 'fact-finding' },
  recentActions: [
    { type: 'click', element: 'new-proposal-btn' },
    { type: 'form_input', element: 'income-field', time: 3000 }
  ]
}

// Mira's Proactive Response
{
  detected_pattern: 'proposal_creation_for_existing_customer',
  confidence: 0.92,
  proactive_message: "I see you're creating a proposal for John Smith. Would you like me to:",
  suggestions: [
    {
      text: "Pre-fill with John's latest financial data",
      action: { type: 'prefill', data: 'customer_financials' }
    },
    {
      text: "Show similar successful proposals",
      action: { type: 'navigate', page: '/proposals/similar?customer=123' }
    },
    {
      text: "Calculate recommended coverage",
      action: { type: 'execute', tool: 'fna_calculator' }
    }
  ]
}
```

### Scenario 2: Struggle Detection

```typescript
// User stuck on form for 5 minutes, multiple field changes
// Mira detects struggle and offers targeted help

// Behavioral Signals
{
  timeOnPage: 300000, // 5 minutes
  formInteractions: 47, // High number of changes
  scrollEvents: 23, // Scrolling up and down
  fieldRevisits: ['income', 'expenses'], // Changed multiple times
}

// Mira's Intervention
{
  detected_pattern: 'form_completion_struggle',
  struggle_indicators: ['excessive_time', 'field_revisits', 'no_progression'],
  proactive_message: "I notice you're spending time on the financial section. Can I help?",
  targeted_help: [
    {
      text: "Show me how to calculate monthly expenses",
      action: { type: 'show_guide', content: 'expense_calculation' }
    },
    {
      text: "Use income calculator",
      action: { type: 'open_tool', tool: 'income_calculator' }
    },
    {
      text: "Skip and come back later",
      action: { type: 'save_draft', skipTo: 'next_section' }
    }
  ]
}
```

### Scenario 3: Smart Navigation Assistance

```typescript
// User repeatedly navigating between customer list and analytics
// Mira recognizes pattern and offers shortcut

// Behavioral Pattern
{
  navigationPattern: [
    '/customers',
    '/analytics',
    '/customers',
    '/analytics',
    '/customers'
  ],
  timePattern: '< 30 seconds per page',
  searchQueries: ['high value', 'premium > 10000']
}

// Mira's Smart Suggestion
{
  detected_pattern: 'comparing_customer_segments',
  proactive_message: "I notice you're analyzing high-value customers. Would you like me to:",
  suggestions: [
    {
      text: "Create a dashboard with high-value customer metrics",
      action: { type: 'create_dashboard', filters: { premium: '>10000' } }
    },
    {
      text: "Open split view: Customers + Analytics",
      action: { type: 'split_view', panels: ['customers', 'analytics'] }
    },
    {
      text: "Export high-value customer list with analytics",
      action: { type: 'export', data: 'high_value_customers_with_metrics' }
    }
  ]
}
```

## Integration with Existing Mira Features

### Enhanced Intent Router

```typescript
// Update intent router to use behavioral signals
class EnhancedIntentRouter extends IntentRouter {
  async classifyIntent(
    userMessage: string, 
    context: MiraContext,
    behavioralContext: BehavioralContext
  ): Promise<IntentClassification> {
    
    // Get base classification
    const baseClassification = await super.classifyIntent(userMessage, context);
    
    // Boost confidence based on behavioral patterns
    const behavioralBoost = this.calculateBehavioralBoost(
      baseClassification.intent,
      behavioralContext
    );
    
    // Adjust confidence
    const adjustedConfidence = Math.min(
      baseClassification.confidence + behavioralBoost,
      1.0
    );
    
    return {
      ...baseClassification,
      confidence: adjustedConfidence,
      behavioral_signals: this.extractSignals(behavioralContext)
    };
  }
  
  private calculateBehavioralBoost(
    intent: string,
    context: BehavioralContext
  ): number {
    // If user is on relevant page, boost confidence
    if (this.isRelevantPage(intent, context.currentPage)) {
      return 0.15;
    }
    
    // If recent actions align with intent, boost more
    if (this.actionsAlignWithIntent(intent, context.recentActions)) {
      return 0.20;
    }
    
    return 0;
  }
}
```

### Enhanced UI Action Executor

```typescript
// Add behavioral tracking to action execution
class EnhancedUIActionExecutor extends UIActionExecutor {
  async executeActions(actions: UIAction[]): Promise<ExecutionResult> {
    // Track action execution attempt
    BehavioralTracker.track({
      type: 'mira_action_execution',
      actions: actions,
      timestamp: new Date()
    });
    
    const result = await super.executeActions(actions);
    
    // Track success/failure for learning
    BehavioralTracker.track({
      type: 'mira_action_result',
      success: result.success,
      actions: actions,
      error: result.error,
      timestamp: new Date()
    });
    
    // Update pattern library
    if (result.success) {
      PatternLibrary.recordSuccess({
        context: this.getCurrentContext(),
        actions: actions
      });
    }
    
    return result;
  }
}
```

## Success Metrics

### User Experience Metrics
- **Task Completion Rate**: Target 30% improvement
- **Time to Complete Tasks**: Target 40% reduction
- **User Satisfaction**: Target NPS > 50
- **Proactive Help Acceptance**: Target > 60%

### Technical Metrics
- **Pattern Detection Accuracy**: Target > 85%
- **Intent Prediction Accuracy**: Target > 80%
- **Suggestion Relevance**: Target > 70%
- **Performance Impact**: < 50ms latency

### Business Metrics
- **Advisor Productivity**: Target 25% increase
- **Training Time**: Target 50% reduction
- **Error Rates**: Target 40% reduction
- **Feature Adoption**: Target 80% in month 1

## Privacy & Security Considerations

### Data Collection Principles
1. **Opt-in by Default** - Users must explicitly enable tracking
2. **Transparent Collection** - Clear indication of what's tracked
3. **No Sensitive Data** - Never track passwords, financial amounts
4. **User Control** - Easy to disable, export, or delete data
5. **Secure Storage** - Encrypted in transit and at rest

### Compliance
- GDPR compliant with user consent and data portability
- PDPA (Singapore) compliant with consent and purpose limitation
- Industry standards for financial data protection

### Implementation

```typescript
// Privacy dashboard component
const PrivacyDashboard = () => {
  return (
    <div className="privacy-settings">
      <h2>Mira Behavioral Tracking Settings</h2>
      
      <Toggle 
        label="Enable behavioral tracking to improve Mira's suggestions"
        checked={settings.trackingEnabled}
        onChange={updateTracking}
      />
      
      <div className="data-types">
        <h3>What we track (when enabled):</h3>
        <ul>
          <li>✓ Page navigation and time spent</li>
          <li>✓ Button clicks and interactions</li>
          <li>✓ Form completion patterns (not values)</li>
          <li>✓ Search queries</li>
        </ul>
        
        <h3>What we never track:</h3>
        <ul>
          <li>✗ Passwords or sensitive data</li>
          <li>✗ Actual financial amounts</li>
          <li>✗ Personal customer information</li>
          <li>✗ Medical or health data</li>
        </ul>
      </div>
      
      <Button onClick={exportMyData}>Export My Data</Button>
      <Button onClick={deleteMyData} variant="danger">Delete All Data</Button>
    </div>
  );
};
```

## Migration Strategy

### Phase 1: Shadow Mode (Week 1)
- Deploy tracking in shadow mode (collect but don't act)
- Validate data quality and patterns
- No user-facing changes

### Phase 2: Internal Beta (Week 2)
- Enable for internal team
- Test proactive suggestions
- Gather feedback and refine

### Phase 3: Limited Release (Week 3)
- 10% of advisors
- A/B test effectiveness
- Monitor acceptance rates

### Phase 4: Full Rollout (Week 4)
- All advisors
- Complete feature set
- Continuous improvement

## Database Schema Updates

```sql
-- New table for behavioral events
CREATE TABLE mira_behavioral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL,
  session_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  page_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for efficient querying
  INDEX idx_behavioral_advisor_session (advisor_id, session_id),
  INDEX idx_behavioral_event_type (event_type),
  INDEX idx_behavioral_created (created_at)
);

-- New table for learned patterns
CREATE TABLE mira_learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(100) NOT NULL,
  pattern_data JSONB NOT NULL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2),
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_patterns_type_confidence (pattern_type, confidence_score DESC)
);

-- Update mira_conversations to include behavioral context
ALTER TABLE mira_conversations
ADD COLUMN behavioral_context JSONB,
ADD COLUMN pattern_matches JSONB,
ADD COLUMN proactive_trigger VARCHAR(50);
```

## API Updates

```typescript
// Enhanced agent-chat endpoint
interface EnhancedAgentChatRequest {
  messages: Message[];
  context: MiraContext;
  behavioral_context?: BehavioralContext;
  mode: 'stream' | 'suggest' | 'insights' | 'proactive';
}

// New proactive endpoint
POST /api/mira/proactive-check
Request: {
  advisor_id: string;
  behavioral_context: BehavioralContext;
}
Response: {
  should_trigger: boolean;
  suggestions: ProactiveSuggestion[];
  confidence: number;
}
```

## Monitoring & Analytics

### New Dashboards

1. **Behavioral Pattern Dashboard**
   - Most common user journeys
   - Struggle point identification
   - Success pattern trends
   - Time-to-task metrics

2. **Proactive Assistance Dashboard**
   - Suggestion trigger rates
   - Acceptance/rejection rates
   - Impact on task completion
   - User satisfaction correlation

3. **Privacy & Compliance Dashboard**
   - Opt-in/opt-out rates
   - Data deletion requests
   - Storage volume metrics
   - Compliance audit trail

## Future Enhancements

### Advanced Pattern Learning
- Cross-advisor pattern sharing (anonymized)
- Industry benchmark patterns
- Seasonal pattern detection
- Role-based pattern libraries

### Multi-modal Context
- Voice interaction patterns
- Screen recording analysis (with consent)
- Mouse movement patterns
- Eye tracking integration

### Predictive Automation
- Auto-complete common workflows
- Predictive form filling
- Suggested next actions
- Workflow templates

### AI Learning Loop
- Reinforcement learning from user feedback
- Transfer learning across similar businesses
- Continuous model improvement
- Personalized assistance models

## Conclusion

This enhanced Mira implementation transforms the assistant from a reactive tool to a predictive copilot that truly understands and anticipates advisor needs. By tracking behavioral patterns while respecting privacy, we can deliver a dramatically improved user experience that makes advisors more productive and successful.

The phased approach ensures we can validate effectiveness at each step while maintaining system stability and user trust. The result will be an AI assistant that feels like a knowledgeable colleague who knows exactly when and how to help.

### Key Benefits

1. **Reduced Friction** - Mira helps before users need to ask
2. **Increased Productivity** - 30-40% faster task completion
3. **Better User Experience** - Contextual, timely assistance
4. **Continuous Improvement** - System learns and adapts
5. **Privacy Respected** - User control and transparency

### Next Steps

1. Review and approve enhanced plan
2. Allocate development resources
3. Begin Phase A implementation
4. Set up measurement framework
5. Prepare user communication

With this enhancement, Mira will become not just an assistant, but a true AI copilot that understands each advisor's journey and provides intelligent, proactive support exactly when needed.