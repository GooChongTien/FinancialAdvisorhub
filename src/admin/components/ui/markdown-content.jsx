/**
 * Markdown Content Component
 * Renders markdown text with proper styling for chat messages
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownContent({ content, className = "" }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      components={{
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 last:mb-0">{children}</p>
        ),

        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-2 mt-2 first:mt-0">{children}</h3>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="ml-2">{children}</li>
        ),

        // Inline code
        code: ({ inline, children, ...props }) => {
          if (inline) {
            return (
              <code className="bg-neutral-200 text-neutral-900 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          }
          // Block code
          return (
            <code className="block bg-neutral-900 text-neutral-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2" {...props}>
              {children}
            </code>
          );
        },

        // Pre (code blocks)
        pre: ({ children }) => (
          <pre className="my-2">{children}</pre>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-700"
          >
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-neutral-300 pl-3 py-1 my-2 italic text-neutral-700">
            {children}
          </blockquote>
        ),

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full border-collapse border border-neutral-300 text-xs">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-neutral-100">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-neutral-300 px-3 py-2 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-neutral-300 px-3 py-2">
            {children}
          </td>
        ),

        // Horizontal rule
        hr: () => (
          <hr className="my-3 border-neutral-300" />
        ),

        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
