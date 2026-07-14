'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

// Terminal-style code block: language tag + copy button on top, monospaced
// code below on a subtle secondary background. No syntax highlighting for
// v0 — matches the design's mono/uppercase aesthetic.
export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard access denied — silently ignore */
    }
  }

  return (
    <div className={`border border-border bg-secondary/40 ${className ?? ''}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/50">
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
          {language ?? 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-mono"
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-[12px] leading-relaxed overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
