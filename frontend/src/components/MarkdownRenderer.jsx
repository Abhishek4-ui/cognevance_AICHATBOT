import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="markdown-body text-xs sm:text-sm leading-relaxed text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-base sm:text-lg font-bold text-white mt-3 mb-2 pb-1.5 border-b border-slate-700/60 flex items-center gap-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm sm:text-base font-bold text-cyan-300 mt-3.5 mb-2 flex items-center gap-1.5" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-purple-300 mt-2.5 mb-1.5" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2.5 leading-relaxed text-slate-200 last:mb-0" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1.5 text-slate-200" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-slate-200" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-cyan-200" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-purple-200" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-cyan-500/80 pl-3 py-1 my-2.5 bg-cyan-950/20 rounded-r text-slate-300 italic" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            return !inline ? (
              <div className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-[#070D1E] shadow-md">
                <div className="flex items-center justify-between px-3 py-1 bg-[#050914] border-b border-slate-800 text-[10px] font-mono text-cyan-400">
                  <span className="uppercase tracking-wider">{lang || 'CODE'}</span>
                </div>
                <pre className="p-3 overflow-x-auto text-[11px] sm:text-xs font-mono text-emerald-300 leading-normal">
                  <code>{children}</code>
                </pre>
              </div>
            ) : (
              <code className="px-1.5 py-0.5 rounded bg-slate-800/90 text-cyan-300 font-mono text-[11px] border border-slate-700/80" {...props}>
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 border border-slate-700/70 rounded-xl">
              <table className="min-w-full divide-y divide-slate-700 text-xs" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2 bg-slate-800/90 text-left font-semibold text-cyan-300" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 border-t border-slate-800 text-slate-300" {...props} />
          ),
          hr: () => (
            <hr className="my-3 border-slate-700/60" />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
