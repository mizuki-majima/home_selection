// 元利均等返済の計算。金額の単位は「万円」、金利は年利（%）。

/** 年利・期間から「毎月1万円返すと借りられる額」（年金現価係数）を返す */
export function pvFactor(annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return n;
  return (1 - Math.pow(1 + r, -n)) / r;
}

/** 借入額・年利・期間から毎月の返済額を返す */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const f = pvFactor(annualRatePct, years);
  if (f === 0) return 0;
  return principal / f;
}

/** 月の返済額から借入額を返す */
export function principalFromMonthly(monthly: number, annualRatePct: number, years: number): number {
  return Math.max(0, monthly) * pvFactor(annualRatePct, years);
}

/**
 * フラット35の総返済負担率の基準（年収400万円未満30%、400万円以上35%）。
 * 他の借入れはないものとする。
 */
export function screeningRatio(annualIncome: number): number {
  return annualIncome < 400 ? 0.3 : 0.35;
}

export interface BorrowableInput {
  income: number; // 年収（万円）
  ratePct: number;
  years: number;
}

/** 審査上の上限から見た「借りられる額」 */
export function borrowable({ income, ratePct, years }: BorrowableInput) {
  const ratio = screeningRatio(income);
  const monthly = (Math.max(0, income) * ratio) / 12;
  return { ratio, monthly, amount: principalFromMonthly(monthly, ratePct, years) };
}

export interface RepayableInput {
  rent: number; // いまの家賃（万円/月）
  saving: number; // 住宅取得のための貯蓄（万円/月）
  upkeep: number; // 入居後の維持費（万円/月）
  ratePct: number;
  years: number;
}

/** 今の家計から逆算した「返せる額」 */
export function repayable({ rent, saving, upkeep, ratePct, years }: RepayableInput) {
  const monthly = Math.max(0, rent + saving - upkeep);
  return { monthly, amount: principalFromMonthly(monthly, ratePct, years) };
}

/** 年収に対する年間返済額の割合 */
export function burdenRatio(monthly: number, annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  return (monthly * 12) / annualIncome;
}
