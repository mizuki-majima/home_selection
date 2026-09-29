import { describe, expect, it } from 'vitest';
import { perTsubo, sqmToTsubo, tsuboBreakdown } from '../../src/lib/tsubo';
import { allocate } from '../../src/lib/budget';
import { asOfLabel, yen } from '../../src/lib/format';
import { project } from '../../src/lib/iso';

describe('坪単価', () => {
  it('1坪は約3.3058㎡', () => {
    expect(sqmToTsubo(3.305785)).toBeCloseTo(1, 4);
  });

  it('参考値（当方算出）を再現する', () => {
    expect(perTsubo(4259.8, 118.4)).toBeCloseTo(118.9, 1); // 約119
    expect(perTsubo(3737.6, 110.3)).toBeCloseTo(112.0, 1); // 約112
    expect(perTsubo(4760, 122.5)).toBeCloseTo(128.5, 1); // 約128
    expect(3488 / 41.1).toBeCloseTo(84.9, 1); // 約85
  });

  it('分母を施工床面積にすると安く見え、分子を広げると高く見える', () => {
    const base = { floorTsubo: 35, constructionMarkupPct: 10, body: 2800, ancillaryPct: 20, miscPct: 10 };
    const cheap = tsuboBreakdown({ ...base, numerator: 'body', denominator: 'construction' });
    const full = tsuboBreakdown({ ...base, numerator: 'withMisc', denominator: 'floor' });
    expect(cheap.price).toBeCloseTo(2800 / 38.5, 5);
    expect(full.price).toBeCloseTo((2800 * 1.3) / 35, 5);
    expect(cheap.price).toBe(cheap.min);
    expect(full.price).toBe(full.max);
  });
});

describe('総予算の配分', () => {
  it('土地に払った分だけ建物が減る', () => {
    const r = allocate({ total: 5000, landArea: 150, landUnit: 10, buildUnit: 35, performanceExtra: 0, miscPct: 0 });
    expect(r.land).toBe(1500);
    expect(r.building).toBe(3500);
    expect(r.floorArea).toBe(100);
    expect(r.landShare).toBeCloseTo(0.3, 5);
  });

  it('容積率の上限を超えたら警告', () => {
    const r = allocate({ total: 8000, landArea: 60, landUnit: 1, buildUnit: 30, performanceExtra: 0, miscPct: 0, farPct: 150 });
    expect(r.overFar).toBe(true);
  });

  it('土地だけで予算を超えたら建物は0', () => {
    const r = allocate({ total: 1000, landArea: 200, landUnit: 10, buildUnit: 30, performanceExtra: 0, miscPct: 0 });
    expect(r.building).toBe(0);
    expect(r.overBudget).toBe(true);
  });
});

describe('整形・投影', () => {
  it('時点ラベル', () => {
    expect(asOfLabel('2026-09')).toBe('2026年9月時点');
    expect(asOfLabel('2026-09-29')).toBe('2026年9月29日時点');
    expect(asOfLabel('2025年度')).toBe('2025年度時点');
  });

  it('億円表示', () => {
    expect(yen(10332.7)).toBe('1億333万円');
    expect(yen(5312.9)).toBe('5,313万円');
  });

  it('アイソメ投影の原点と上方向', () => {
    expect(project([0, 0, 0])).toEqual([0, 0]);
    expect(project([0, 0, 1])[1]).toBe(-1);
  });
});
