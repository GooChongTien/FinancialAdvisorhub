import { describe, it, expect } from 'vitest';
import { enforceGuardrails, scrubPII } from '../../src/lib/mira/guardrails.js';

describe('guardrails smoke', () => {
  it('scrubs basic PII', () => {
    const out = scrubPII('Email me at user@example.com or call +65 1234 5678');
    expect(out).not.toContain('user@example.com');
    expect(out).not.toMatch(/\b\+?65\b/);
  });

  it('blocks toxic content', () => {
    const r = enforceGuardrails('You are an idiot');
    expect(r.blocked).toBe(true);
    expect(r.reason).toBe('toxicity');
  });
});

