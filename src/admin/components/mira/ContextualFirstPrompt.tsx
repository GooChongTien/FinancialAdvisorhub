/**
 * Contextual First Prompt Component
 *
 * Shows module-specific prompt suggestions when chat is empty
 * Adapts based on current page and context
 */

import { useMemo } from 'react';
import { useMiraContext } from '@/admin/state/providers/MiraContextProvider';
import { getContextualPrompts, type ContextualPrompt } from '@/lib/mira/contextual-prompts';
import clsx from 'clsx';

interface ContextualFirstPromptProps {
  onSelectPrompt: (promptText: string) => void;
  className?: string;
}

export function ContextualFirstPrompt({ onSelectPrompt, className }: ContextualFirstPromptProps) {
  const { module, page, pageData } = useMiraContext();

  const modulePrompts = useMemo(() => {
    return getContextualPrompts(module, page, pageData);
  }, [module, page, pageData]);

  const handleClick = (prompt: ContextualPrompt) => {
    onSelectPrompt(prompt.text);
  };

  return (
    <div className={clsx('w-full max-w-3xl mx-auto px-4 py-6', className)}>
      {/* Greeting */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg mb-3">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          {modulePrompts.greeting}
        </h3>
        <p className="text-sm text-slate-500">
          Select a suggestion below or type your own question
        </p>
      </div>

      {/* Prompt Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modulePrompts.prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => handleClick(prompt)}
            className={clsx(
              'group relative overflow-hidden rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all',
              'hover:border-blue-500 hover:shadow-lg active:scale-[0.98]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Content */}
            <div className="relative flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 text-2xl mt-0.5">
                {prompt.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                  {prompt.text}
                </div>
                <div className="text-xs text-slate-500 line-clamp-2">
                  {prompt.description}
                </div>
              </div>

              {/* Category badge */}
              <div className={clsx(
                'flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
                prompt.category === 'quick_action' && 'bg-blue-50 text-blue-700',
                prompt.category === 'insight' && 'bg-purple-50 text-purple-700',
                prompt.category === 'navigation' && 'bg-green-50 text-green-700',
                prompt.category === 'help' && 'bg-orange-50 text-orange-700'
              )}>
                {prompt.category.replace('_', ' ')}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-400">
          💡 Tip: Press{' '}
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 border border-slate-300 rounded">
            Cmd+K
          </kbd>{' '}
          to open split view and chat while browsing
        </p>
      </div>
    </div>
  );
}
