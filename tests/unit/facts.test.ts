import { describe, expect, it } from 'vitest';
import { allFacts, getFact, parseFacts, valueOf } from '../../src/lib/facts';
import { SourceRegistry } from '../../src/lib/sources';

const ok = {
  id: 'x-1',
  claim: 'テスト',
  value: 1,
  asOf: '2026-09',
  source: { title: 't', publisher: 'p', url: 'https://example.com/', type: 'primary' },
  volatility: 'stable',
};

describe('事実データのスキーマ', () => {
  it('実データはすべて検証を通る', () => {
    expect(allFacts().length).toBeGreaterThan(50);
    for (const f of allFacts()) {
      expect(f.source.url).toMatch(/^https:\/\//);
      expect(f.asOf.length).toBeGreaterThan(0);
    }
  });

  it('出典がない事実はエラー', () => {
    const { source: _omit, ...noSource } = ok;
    expect(() => parseFacts({ 'a.yaml': [noSource] })).toThrow(/source/);
  });

  it('時点がない事実はエラー', () => {
    expect(() => parseFacts({ 'a.yaml': [{ ...ok, asOf: '' }] })).toThrow(/asOf/);
  });

  it('ID の重複はエラー', () => {
    expect(() => parseFacts({ 'a.yaml': [ok, ok] })).toThrow(/重複/);
  });

  it('derived.from の参照先がなければエラー', () => {
    expect(() => parseFacts({ 'a.yaml': [{ ...ok, derived: { formula: 'f', from: ['nope'] } }] })).toThrow(/nope/);
  });

  it('存在しない ID の参照はエラー', () => {
    expect(() => getFact('does-not-exist')).toThrow();
    expect(() => valueOf('f35-2025-chumon-tochi', 'nope')).toThrow();
  });

  it('当方算出の値は出典の値と整合する', () => {
    const share = valueOf('f35-land-share', 'shuto');
    const c = valueOf('f35-region', 'shutoConstruction');
    const l = valueOf('f35-region', 'shutoLand');
    expect(Math.round((l / (c + l)) * 100)).toBe(share);
    expect(valueOf('tax-loan-max-credit', 'zeh')).toBeCloseTo(valueOf('tax-loan-limit', 'zeh') * 0.007, 5);
  });
});

describe('出典の番号づけ', () => {
  it('同じ出典は同じ番号、初出順に採番', () => {
    const reg = new SourceRegistry();
    const a = reg.register('f35-2025-chumon-tochi');
    const b = reg.register('mlit-shijo-r7-price');
    const c = reg.register('f35-2025-tateuri');
    expect(a.n).toBe(1);
    expect(b.n).toBe(2);
    expect(c.n).toBe(1);
    expect(reg.entries()).toHaveLength(2);
  });
});
