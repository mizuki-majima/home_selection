// ページ内で参照された出典に番号を振る。ページごとに1つのレジストリを Astro.locals に置く。
import { getFact, type Fact, type Source } from './facts';

export interface SourceEntry {
  n: number;
  source: Source;
  asOf: Set<string>;
}

export class SourceRegistry {
  private byUrl = new Map<string, SourceEntry>();

  register(id: string): { n: number; fact: Fact } {
    const fact = getFact(id);
    let entry = this.byUrl.get(fact.source.url);
    if (!entry) {
      entry = { n: this.byUrl.size + 1, source: fact.source, asOf: new Set() };
      this.byUrl.set(fact.source.url, entry);
    }
    entry.asOf.add(fact.asOf);
    return { n: entry.n, fact };
  }

  entries(): SourceEntry[] {
    return [...this.byUrl.values()].sort((a, b) => a.n - b.n);
  }
}

export function registryOf(locals: { __sources?: unknown }): SourceRegistry {
  if (!(locals.__sources instanceof SourceRegistry)) {
    locals.__sources = new SourceRegistry();
  }
  return locals.__sources as SourceRegistry;
}
