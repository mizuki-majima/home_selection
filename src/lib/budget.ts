// 総予算を土地と建物に配分する計算。金額は万円、面積は㎡。

export interface BudgetInput {
  total: number; // 総予算
  landArea: number; // 敷地面積
  landUnit: number; // 土地の単価（万円/㎡）
  buildUnit: number; // 建物の単価（万円/㎡）
  performanceExtra: number; // 性能グレードの上乗せ額（利用者入力）
  miscPct: number; // 諸費用（総予算に対する%）
  farPct?: number; // 容積率（%）。指定があれば上限チェックをする
}

export function allocate(input: BudgetInput) {
  const misc = (input.total * input.miscPct) / 100;
  const land = input.landArea * input.landUnit;
  const building = Math.max(0, input.total - misc - land - input.performanceExtra);
  const floorArea = input.buildUnit > 0 ? building / input.buildUnit : 0;
  const overBudget = input.total - misc - land - input.performanceExtra < 0;
  const maxFloorByFar = input.farPct !== undefined ? (input.landArea * input.farPct) / 100 : null;
  const overFar = maxFloorByFar !== null && floorArea > maxFloorByFar;
  return {
    misc,
    land,
    building,
    extra: input.performanceExtra,
    floorArea,
    landShare: input.total > 0 ? land / input.total : 0,
    overBudget,
    maxFloorByFar,
    overFar,
  };
}
