'use client';

import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * ENK-001 / T-025: Markdown renderer built only from React elements.
 * Raw HTML is never interpreted (it renders as text) and only http(s)/mailto links are clickable,
 * so a model answer cannot inject markup or scripts.
 */

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'code'; text: string; lang: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'table'; header: string[]; rows: string[][] }
  | { kind: 'rule' };

const SAFE_LINK = /^(https?:\/\/|mailto:)/i;

function splitTableRow(line: string) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i += 1; continue; }

    const fence = line.match(/^\s*```\s*([\w+-]*)/);
    if (fence) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) { body.push(lines[i]); i += 1; }
      i += 1;
      blocks.push({ kind: 'code', text: body.join('\n'), lang: fence[1] });
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) { blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] }); i += 1; continue; }

    if (/^\s*(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line)) { blocks.push({ kind: 'rule' }); i += 1; continue; }

    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const header = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(splitTableRow(lines[i])); i += 1; }
      blocks.push({ kind: 'table', header, rows });
      continue;
    }

    const listMatch = line.match(/^\s*([-*+]|\d+[.)])\s+/);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const items: string[] = [];
      while (i < lines.length) {
        const item = lines[i].match(/^\s*([-*+]|\d+[.)])\s+(.*)$/);
        if (!item || /\d/.test(item[1]) !== ordered) break;
        items.push(item[2]);
        i += 1;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, '')); i += 1; }
      blocks.push({ kind: 'quote', text: quote.join(' ') });
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^\s*(#{1,6}\s|```|>|[-*+]\s|\d+[.)]\s)/.test(lines[i])
    ) { paragraph.push(lines[i]); i += 1; }
    if (!paragraph.length) { paragraph.push(line); i += 1; }
    blocks.push({ kind: 'paragraph', text: paragraph.join('\n') });
  }

  return blocks;
}

// Inline: `code`, **bold**, __bold__, *italic*, _italic_, ~~strike~~, [label](url), bare URLs.
const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(~~[^~]+~~)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) {
      nodes.push(<code key={key} className="rounded bg-black/25 px-1 py-0.5 font-mono text-[0.85em]">{token.slice(1, -1)}</code>);
    } else if (match[2]) {
      nodes.push(<strong key={key} className="font-bold">{renderInline(token.slice(2, -2), key)}</strong>);
    } else if (match[3]) {
      nodes.push(<del key={key}>{renderInline(token.slice(2, -2), key)}</del>);
    } else if (match[4]) {
      nodes.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    } else if (match[5]) {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/) || [];
      nodes.push(SAFE_LINK.test(href || '')
        ? <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">{renderInline(label, key)}</a>
        : <Fragment key={key}>{label}</Fragment>);
    } else if (match[6]) {
      nodes.push(<a key={key} href={token} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline underline-offset-2">{token}</a>);
    }
    last = start + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderLines(text: string, key: string) {
  return text.split('\n').map((line, index, all) => (
    <Fragment key={`${key}-l${index}`}>{renderInline(line, `${key}-l${index}`)}{index < all.length - 1 && <br />}</Fragment>
  ));
}

export function SafeMarkdown({ content, className }: { content: string; className?: string }) {
  const blocks = parseBlocks(content || '');
  return (
    <div className={cn('space-y-3 break-words', className)}>
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.kind) {
          case 'heading': {
            const size = block.level <= 2 ? 'text-base' : 'text-sm';
            return <p key={key} role="heading" aria-level={block.level} className={cn('font-black', size)}>{renderInline(block.text, key)}</p>;
          }
          case 'code':
            return (
              <pre key={key} className="overflow-x-auto rounded-xl bg-black/35 p-3 text-xs leading-5">
                <code className="font-mono" data-lang={block.lang || undefined}>{block.text}</code>
              </pre>
            );
          case 'list': {
            const List = block.ordered ? 'ol' : 'ul';
            return (
              <List key={key} className={cn('space-y-1 pl-5', block.ordered ? 'list-decimal' : 'list-disc')}>
                {block.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}
              </List>
            );
          }
          case 'quote':
            return <blockquote key={key} className="border-l-2 border-current/40 pl-3 opacity-90">{renderInline(block.text, key)}</blockquote>;
          case 'table':
            return (
              <div key={key} className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr>{block.header.map((cell, c) => <th key={c} scope="col" className="border-b border-current/25 px-2 py-1.5 font-bold">{renderInline(cell, `${key}-h${c}`)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>{row.map((cell, c) => <td key={c} className="border-b border-current/10 px-2 py-1.5 align-top">{renderInline(cell, `${key}-${r}-${c}`)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'rule':
            return <hr key={key} className="border-current/20" />;
          default:
            return <p key={key}>{renderLines(block.text, key)}</p>;
        }
      })}
    </div>
  );
}

// Plain text for clipboard, sharing and speech: the same answer without Markdown markers.
export function markdownToPlainText(content: string) {
  return (content || '')
    .replace(/```[\w+-]*\n?/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, '$1$2')
    .replace(/\*([^*\s][^*]*)\*|_([^_\s][^_]*)_/g, '$1$2')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .trim();
}
