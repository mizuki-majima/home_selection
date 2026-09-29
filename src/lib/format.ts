// 数値・日付の整形

export function num(value: number, digits = 0): string {
  return value.toLocaleString('ja-JP', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 万円表示。1万円未満の端数を指定桁で丸める */
export function man(value: number, digits = 0): string {
  return `${num(value, digits)}万円`;
}

/** 1億円以上は「1億2,345万円」 */
export function yen(value: number): string {
  const v = Math.round(value);
  if (Math.abs(v) >= 10000) {
    const oku = Math.trunc(v / 10000);
    const rest = Math.abs(v % 10000);
    return rest === 0 ? `${oku}億円` : `${oku}億${num(rest)}万円`;
  }
  return `${num(v)}万円`;
}

export function pct(ratio: number, digits = 1): string {
  return `${num(ratio * 100, digits)}%`;
}

export function sqm(value: number, digits = 1): string {
  return `${num(value, digits)}㎡`;
}

/** "2026-09" / "2026-09-29" を「2026年9月時点」にする。それ以外はそのまま＋「時点」 */
export function asOfLabel(asOf: string): string {
  const m = asOf.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (m) {
    const [, y, mo, d] = m;
    return d ? `${y}年${Number(mo)}月${Number(d)}日時点` : `${y}年${Number(mo)}月時点`;
  }
  return asOf.endsWith('時点') ? asOf : `${asOf}時点`;
}
