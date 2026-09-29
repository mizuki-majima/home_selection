// 坪単価の計算。1坪 = 400/121 ㎡（約3.3058㎡）。金額は万円。

export const SQM_PER_TSUBO = 400 / 121;

export function sqmToTsubo(sqm: number): number {
  return sqm / SQM_PER_TSUBO;
}

export function tsuboToSqm(tsubo: number): number {
  return tsubo * SQM_PER_TSUBO;
}

/** 金額 ÷ 面積（㎡）を坪単価（万円/坪）にする */
export function perTsubo(amount: number, sqm: number): number {
  if (sqm <= 0) return 0;
  return amount / sqmToTsubo(sqm);
}

export type Denominator = 'floor' | 'construction';
export type Numerator = 'body' | 'withAncillary' | 'withMisc';

export interface TsuboInput {
  floorTsubo: number; // 延床面積（坪）
  constructionMarkupPct: number; // 施工床面積の上乗せ率（%）。ポーチ・吹抜け等
  body: number; // 本体工事費（万円）
  ancillaryPct: number; // 付帯工事の割合（本体に対する%）
  miscPct: number; // 諸費用の割合（本体に対する%）
  denominator: Denominator;
  numerator: Numerator;
}

export function tsuboBreakdown(input: TsuboInput) {
  const ancillary = (input.body * input.ancillaryPct) / 100;
  const misc = (input.body * input.miscPct) / 100;
  const numerators: Record<Numerator, number> = {
    body: input.body,
    withAncillary: input.body + ancillary,
    withMisc: input.body + ancillary + misc,
  };
  const denominators: Record<Denominator, number> = {
    floor: input.floorTsubo,
    construction: input.floorTsubo * (1 + input.constructionMarkupPct / 100),
  };
  const price = (n: Numerator, d: Denominator) => (denominators[d] > 0 ? numerators[n] / denominators[d] : 0);
  const all = (['body', 'withAncillary', 'withMisc'] as Numerator[]).flatMap((n) =>
    (['floor', 'construction'] as Denominator[]).map((d) => price(n, d)),
  );
  return {
    ancillary,
    misc,
    total: numerators.withMisc,
    numerator: numerators[input.numerator],
    denominator: denominators[input.denominator],
    price: price(input.numerator, input.denominator),
    min: Math.min(...all),
    max: Math.max(...all),
  };
}
