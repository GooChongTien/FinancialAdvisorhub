import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('Test Infrastructure', () => {
  it('should have React Testing Library available', () => {
    expect(render).toBeDefined();
  });

  it('should have jest-dom matchers', () => {
    expect(expect.toBeInTheDocument).toBeDefined();
    expect(expect.toHaveClass).toBeDefined();
  });

  it('should have mocked window.matchMedia', () => {
    expect(window.matchMedia).toBeDefined();
    const result = window.matchMedia('(min-width: 768px)');
    expect(result.matches).toBe(false);
  });

  it('should have mocked IntersectionObserver', () => {
    expect(global.IntersectionObserver).toBeDefined();
    const observer = new IntersectionObserver(() => {});
    expect(observer.observe).toBeDefined();
  });

  it('should have mocked ResizeObserver', () => {
    expect(global.ResizeObserver).toBeDefined();
    const observer = new ResizeObserver(() => {});
    expect(observer.observe).toBeDefined();
  });
});
