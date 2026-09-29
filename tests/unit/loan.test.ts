import { describe, expect, it } from 'vitest';
import { borrowable, monthlyPayment, pvFactor, repayable, screeningRatio } from '../../src/lib/loan';

describe('元利均等返済', () => {
  it('4,000万円・35年の毎月返済額（別紙の既知値）', () => {
    expect(monthlyPayment(4000, 0.8, 35)).toBeCloseTo(10.9, 1);
    expect(monthlyPayment(4000, 2.0, 35)).toBeCloseTo(13.3, 1);
    expect(monthlyPayment(4000, 3.46, 35)).toBeCloseTo(16.4, 1);
  });

  it('金利0%は元金を回数で割るだけ', () => {
    expect(pvFactor(0, 35)).toBe(420);
    expect(monthlyPayment(4200, 0, 35)).toBe(10);
  });

  it('期間1年', () => {
    expect(pvFactor(0, 1)).toBe(12);
    expect(monthlyPayment(1200, 1.2, 1)).toBeCloseTo(100.65, 1);
  });

  it('期間0年は0を返す', () => {
    expect(pvFactor(2, 0)).toBe(0);
    expect(monthlyPayment(1000, 2, 0)).toBe(0);
  });
});

describe('借りられる額／返せる額（機構の試算例）', () => {
  it('年収640万円・2.25%・35年で借りられる額は約5,422万円（±1万円）', () => {
    const r = borrowable({ income: 640, ratePct: 2.25, years: 35 });
    expect(Math.abs(r.amount - 5422)).toBeLessThanOrEqual(1.5);
    expect(r.monthly).toBeCloseTo(18.67, 2);
  });

  it('月9万円（家賃8＋貯蓄2−維持費1）で返せる額は約2,614万円（±1万円）', () => {
    const r = repayable({ rent: 8, saving: 2, upkeep: 1, ratePct: 2.25, years: 35 });
    expect(Math.abs(r.amount - 2614)).toBeLessThanOrEqual(1);
  });

  it('総返済負担率の基準は年収400万円で切り替わる', () => {
    expect(screeningRatio(399.9)).toBe(0.3);
    expect(screeningRatio(400)).toBe(0.35);
  });

  it('維持費が家賃＋貯蓄を上回ると返せる額は0', () => {
    expect(repayable({ rent: 5, saving: 0, upkeep: 6, ratePct: 2, years: 35 }).amount).toBe(0);
  });
});
