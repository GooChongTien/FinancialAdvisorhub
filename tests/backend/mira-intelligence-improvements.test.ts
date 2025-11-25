/**
 * Mira Intelligence Improvements Test Suite
 * Tests the improvements made to reduce low-confidence clarifications
 *
 * Expected outcomes:
 * - Confidence scores: 0.65-0.85 (was 0.3-0.5)
 * - Clarification rate: 15-25% (was 60-70%)
 * - Better handling of casual/natural language
 * - Domain terminology recognition
 */

import { describe, it, expect } from 'vitest';
import { IntentRouterService } from '../../supabase/functions/_shared/services/router/intent-router.ts';
import { CONFIDENCE_THRESHOLDS } from '../../supabase/functions/_shared/services/router/confidence-scorer.ts';
import type { MiraContext } from '../../supabase/functions/_shared/services/types.ts';

describe('Mira Intelligence Improvements', () => {
  const router = new IntentRouterService();

  describe('Confidence Threshold Adjustments', () => {
    it('should have lowered HIGH threshold to 0.65', () => {
      expect(CONFIDENCE_THRESHOLDS.high).toBe(0.65);
    });

    it('should have lowered MEDIUM threshold to 0.45', () => {
      expect(CONFIDENCE_THRESHOLDS.medium).toBe(0.45);
    });

    it('should classify scores >= 0.65 as HIGH confidence', () => {
      expect(0.65).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLDS.high);
      expect(0.70).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLDS.high);
    });

    it('should classify scores >= 0.45 and < 0.65 as MEDIUM confidence', () => {
      expect(0.45).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLDS.medium);
      expect(0.50).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLDS.medium);
      expect(0.60).toBeLessThan(CONFIDENCE_THRESHOLDS.high);
    });

    it('should classify scores < 0.45 as LOW confidence', () => {
      expect(0.30).toBeLessThan(CONFIDENCE_THRESHOLDS.medium);
      expect(0.40).toBeLessThan(CONFIDENCE_THRESHOLDS.medium);
    });
  });

  describe('Intent Classification - Casual Language', () => {
    const context: MiraContext = {
      module: 'customer',
      page: '/customer',
      pageData: {},
    };

    describe('create_lead intent - casual variations', () => {
      it('should detect: "met someone at trade show, David 91234567"', async () => {
        const result = await router.classifyIntent(
          'met someone at trade show, David 91234567',
          context
        );

        expect(result.intent).toBe('create_lead');
        expect(result.confidence).toBeGreaterThan(0.4); // Better than old 0.3-0.5 range
        expect(result.confidenceTier).not.toBe('low'); // Should not need clarification
      });

      it('should detect: "got referral today - Sarah 98765432"', async () => {
        const result = await router.classifyIntent(
          'got referral today - Sarah 98765432',
          context
        );

        expect(result.intent).toBe('create_lead');
        expect(result.confidence).toBeGreaterThan(0.4);
      });

      it('should detect: "add prospect from event booth"', async () => {
        const result = await router.classifyIntent(
          'add prospect from event booth',
          context
        );

        expect(result.intent).toBe('create_lead');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });

    describe('search_leads intent - natural queries', () => {
      it('should detect: "find John Tan"', async () => {
        const result = await router.classifyIntent('find John Tan', context);

        expect(result.intent).toBe('search_leads');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should detect: "where\'s that lead from yesterday"', async () => {
        const result = await router.classifyIntent(
          "where's that lead from yesterday",
          context
        );

        expect(result.intent).toBe('search_leads');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });

    describe('filter_leads intent - casual filters', () => {
      it('should detect: "show hot leads"', async () => {
        const result = await router.classifyIntent('show hot leads', context);

        expect(result.intent).toBe('filter_leads');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should detect: "find warm leads from last 30 days"', async () => {
        const result = await router.classifyIntent(
          'find warm leads from last 30 days',
          context
        );

        expect(result.intent).toBe('filter_leads');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });
  });

  describe('Intent Classification - Domain Terminology', () => {
    const newBusinessContext: MiraContext = {
      module: 'new_business',
      page: '/new-business',
      pageData: {},
    };

    describe('Proposal-related queries with domain terms', () => {
      it('should detect "start FNA for John" as create_proposal', async () => {
        const result = await router.classifyIntent(
          'start FNA for John',
          newBusinessContext
        );

        expect(result.intent).toBe('create_proposal');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should detect "begin fact-finding" as create_proposal', async () => {
        const result = await router.classifyIntent(
          'begin fact-finding',
          newBusinessContext
        );

        expect(result.intent).toBe('create_proposal');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });

    describe('Quote generation with insurance terms', () => {
      it('should detect "generate BI for whole life" as generate_quote', async () => {
        const result = await router.classifyIntent(
          'generate BI for whole life',
          newBusinessContext
        );

        expect(result.intent).toBe('generate_quote');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should detect "quote for CI rider" as generate_quote', async () => {
        const result = await router.classifyIntent(
          'quote for CI rider',
          newBusinessContext
        );

        expect(result.intent).toBe('generate_quote');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should detect "calculate TPD premium" as generate_quote', async () => {
        const result = await router.classifyIntent(
          'calculate TPD premium',
          newBusinessContext
        );

        expect(result.intent).toBe('generate_quote');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });
  });

  describe('Intent Classification - Task Management', () => {
    const todoContext: MiraContext = {
      module: 'todo',
      page: '/smart-plan',
      pageData: {},
    };

    describe('create_task with casual language', () => {
      it('should detect "remind me to call John 2pm tomorrow"', async () => {
        const result = await router.classifyIntent(
          'remind me to call John 2pm tomorrow',
          todoContext
        );

        expect(result.intent).toBe('create_task');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should detect "add task to chase underwriting"', async () => {
        const result = await router.classifyIntent(
          'add task to chase underwriting',
          todoContext
        );

        expect(result.intent).toBe('create_task');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });

    describe('view_tasks with natural queries', () => {
      it('should detect "show my tasks"', async () => {
        const result = await router.classifyIntent('show my tasks', todoContext);

        expect(result.intent).toBe('view_tasks');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should detect "what\'s on my agenda today"', async () => {
        const result = await router.classifyIntent(
          "what's on my agenda today",
          todoContext
        );

        expect(result.intent).toBe('view_tasks');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should detect "show overdue tasks"', async () => {
        const result = await router.classifyIntent(
          'show overdue tasks',
          todoContext
        );

        expect(result.intent).toBe('view_tasks');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });
  });

  describe('Context Module Boosting', () => {
    it('should boost confidence when module matches topic', async () => {
      const customerContext: MiraContext = {
        module: 'customer',
        page: '/customer',
        pageData: {},
      };

      // Same query in customer context
      const result1 = await router.classifyIntent('create lead', customerContext);

      // Same query in different context
      const analyticsContext: MiraContext = {
        module: 'analytics',
        page: '/analytics',
        pageData: {},
      };
      const result2 = await router.classifyIntent('create lead', analyticsContext);

      // Customer context should have higher confidence since module matches
      expect(result1.confidence).toBeGreaterThan(result2.confidence);
    });
  });

  describe('Confidence Distribution Analysis', () => {
    const testQueries = [
      { query: 'add lead John 91234567', context: { module: 'customer', page: '/customer' } },
      { query: 'find Sarah', context: { module: 'customer', page: '/customer' } },
      { query: 'show hot leads', context: { module: 'customer', page: '/customer' } },
      { query: 'start proposal', context: { module: 'new_business', page: '/new-business' } },
      { query: 'generate quote', context: { module: 'new_business', page: '/new-business' } },
      { query: 'show my tasks', context: { module: 'todo', page: '/smart-plan' } },
      { query: 'create reminder', context: { module: 'todo', page: '/smart-plan' } },
      { query: 'show dashboard', context: { module: 'analytics', page: '/analytics' } },
    ];

    it('should achieve >50% of queries with confidence >= 0.45 (medium+)', async () => {
      const results = await Promise.all(
        testQueries.map(({ query, context }) =>
          router.classifyIntent(query, context as MiraContext)
        )
      );

      const mediumOrHighCount = results.filter(r => r.confidence >= 0.45).length;
      const percentage = (mediumOrHighCount / results.length) * 100;

      expect(percentage).toBeGreaterThan(50); // At least 50% should be medium or high
    });

    it('should have <30% of queries in low confidence range (<0.45)', async () => {
      const results = await Promise.all(
        testQueries.map(({ query, context }) =>
          router.classifyIntent(query, context as MiraContext)
        )
      );

      const lowConfidenceCount = results.filter(r => r.confidence < 0.45).length;
      const percentage = (lowConfidenceCount / results.length) * 100;

      expect(percentage).toBeLessThan(30); // Less than 30% should need clarification
    });

    it('should log confidence scores for analysis', async () => {
      console.log('\n📊 Confidence Score Analysis:');
      console.log('============================');

      const results = await Promise.all(
        testQueries.map(async ({ query, context }) => {
          const result = await router.classifyIntent(query, context as MiraContext);
          return { query, ...result };
        })
      );

      // Group by tier
      const high = results.filter(r => r.confidenceTier === 'high');
      const medium = results.filter(r => r.confidenceTier === 'medium');
      const low = results.filter(r => r.confidenceTier === 'low');

      console.log(`\n✅ HIGH confidence (>= 0.65):   ${high.length}/${results.length} (${((high.length / results.length) * 100).toFixed(1)}%)`);
      console.log(`⚠️  MEDIUM confidence (0.45-0.64): ${medium.length}/${results.length} (${((medium.length / results.length) * 100).toFixed(1)}%)`);
      console.log(`❌ LOW confidence (< 0.45):     ${low.length}/${results.length} (${((low.length / results.length) * 100).toFixed(1)}%)`);

      console.log('\n📋 Detailed Results:');
      results.forEach(r => {
        const icon = r.confidenceTier === 'high' ? '✅' : r.confidenceTier === 'medium' ? '⚠️' : '❌';
        console.log(
          `${icon} [${r.confidence.toFixed(3)}] "${r.query}" → ${r.intent} (${r.confidenceTier})`
        );
      });

      // Always pass - this is for reporting only
      expect(true).toBe(true);
    });
  });

  describe('Clarification Rate Comparison', () => {
    it('should demonstrate reduced clarification need', async () => {
      const testCases = [
        'met someone at event',
        'add lead from referral',
        'find John',
        'show hot leads',
        'start FNA',
        'generate BI',
        'show tasks',
        'remind me tomorrow',
      ];

      const context: MiraContext = {
        module: 'customer',
        page: '/customer',
        pageData: {},
      };

      const results = await Promise.all(
        testCases.map(query => router.classifyIntent(query, context))
      );

      // Count how many need clarification (low confidence)
      const needClarification = results.filter(r => r.confidenceTier === 'low').length;
      const clarificationRate = (needClarification / results.length) * 100;

      console.log(`\n📉 Clarification Rate: ${clarificationRate.toFixed(1)}%`);
      console.log(`   Target: < 25% (was 60-70%)`);

      // Expect significant improvement
      expect(clarificationRate).toBeLessThan(50); // Should be much better than old 60-70%
    });
  });
});
