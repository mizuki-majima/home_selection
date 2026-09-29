import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { describe, expect, it } from 'vitest';

// サブセットフォントに含めた文字（scripts/subset_fonts.py が生成）
const covered = new Set(readFileSync('src/data/font-chars.txt', 'utf-8'));
const EXTS = new Set(['.astro', '.svelte', '.ts', '.yaml', '.css']);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : EXTS.has(extname(p)) ? [p] : [];
  });
}

describe('サブセットフォント', () => {
  it('src/ で使っている文字がすべてフォントに含まれている（不足したら npm run fonts）', () => {
    const missing = new Set<string>();
    for (const file of walk('src')) {
      for (const ch of readFileSync(file, 'utf-8')) {
        if (ch === '\n' || ch === '\r' || ch === '\t') continue;
        if (!covered.has(ch)) missing.add(ch);
      }
    }
    expect([...missing].join('')).toBe('');
  });
});
