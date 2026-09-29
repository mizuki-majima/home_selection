// 事実データの読み込みと検証。出典・時点のない事実や、存在しない ID の参照はビルドエラーにする。
import { parse } from 'yaml';
import { z } from 'zod';

const sourceSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  type: z.enum(['primary', 'secondary']),
});

export const factSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9.\-_]*$/),
  claim: z.string().min(1),
  value: z.union([z.number(), z.string()]).optional(),
  values: z.record(z.number()).optional(),
  unit: z.string().optional(),
  digits: z.number().int().min(0).max(3).optional(),
  asOf: z.string().min(1),
  source: sourceSchema,
  volatility: z.enum(['stable', 'annual', 'volatile']),
  derived: z
    .object({
      formula: z.string().min(1),
      from: z.array(z.string()).optional(),
    })
    .optional(),
  note: z.string().optional(),
});

export type Fact = z.infer<typeof factSchema>;
export type Source = Fact['source'];

/** YAML から読み込んだ配列群を検証して ID → Fact の Map にする */
export function parseFacts(groups: Record<string, unknown>): Map<string, Fact> {
  const map = new Map<string, Fact>();
  for (const [file, raw] of Object.entries(groups)) {
    if (!Array.isArray(raw)) throw new Error(`${file}: 事実データは配列で書いてください`);
    raw.forEach((entry, i) => {
      const result = factSchema.safeParse(entry);
      if (!result.success) {
        const id = (entry as { id?: string })?.id ?? `#${i}`;
        const msg = result.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ');
        throw new Error(`${file} ${id}: ${msg}`);
      }
      if (map.has(result.data.id)) throw new Error(`${file}: ID が重複しています: ${result.data.id}`);
      map.set(result.data.id, result.data);
    });
  }
  for (const fact of map.values()) {
    for (const ref of fact.derived?.from ?? []) {
      if (!map.has(ref)) throw new Error(`${fact.id}: derived.from の参照先がありません: ${ref}`);
    }
  }
  return map;
}

const rawFiles = import.meta.glob('../data/facts/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const FACTS = parseFacts(
  Object.fromEntries(Object.entries(rawFiles).map(([file, text]) => [file, parse(text)])),
);

export function getFact(id: string): Fact {
  const fact = FACTS.get(id);
  if (!fact) throw new Error(`事実データに ID がありません: ${id}`);
  return fact;
}

/** 数値の事実を取り出す。key を渡すと values の中から取り出す（なければエラー） */
export function valueOf(id: string, key?: string): number {
  const fact = getFact(id);
  const v = key === undefined ? fact.value : fact.values?.[key];
  if (typeof v !== 'number') throw new Error(`${id}${key ? `.${key}` : ''} の値が数値ではありません`);
  return v;
}

export function allFacts(): Fact[] {
  return [...FACTS.values()];
}
