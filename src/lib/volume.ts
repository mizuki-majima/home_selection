// 建ぺい率・容積率・前面道路・セットバックの計算（建築基準法42・43・52・53条、施行令2条）。
// 特定道路の緩和、天空率、条例による上乗せ規制などは扱わない簡略版。

export type ZoneId =
  | 'r1l'
  | 'r2l'
  | 'rden'
  | 'r1m'
  | 'r2m'
  | 'r1'
  | 'r2'
  | 'rq'
  | 'cn'
  | 'c'
  | 'iq'
  | 'i'
  | 'ie';

export interface Zone {
  id: ZoneId;
  name: string;
  /** 都市計画で指定できる建ぺい率（%） */
  bcr: number[];
  /** 都市計画で指定できる容積率（%） */
  far: number[];
  /** 前面道路の幅に掛ける係数 */
  roadFactor: 0.4 | 0.6;
  /** 絶対高さの制限（m）。なければ null */
  absHeight: [number, number] | null;
  /** 北側斜線（立ち上がり m, 勾配）。なければ null */
  northSlope: [number, number] | null;
  housingAllowed: boolean;
}

const LOW_BCR = [30, 40, 50, 60];
const LOW_FAR = [50, 60, 80, 100, 150, 200];
const MID_FAR = [100, 150, 200, 300, 400, 500];

export const ZONES: Zone[] = [
  { id: 'r1l', name: '第一種低層住居専用地域', bcr: LOW_BCR, far: LOW_FAR, roadFactor: 0.4, absHeight: [10, 12], northSlope: [5, 1.25], housingAllowed: true },
  { id: 'r2l', name: '第二種低層住居専用地域', bcr: LOW_BCR, far: LOW_FAR, roadFactor: 0.4, absHeight: [10, 12], northSlope: [5, 1.25], housingAllowed: true },
  { id: 'rden', name: '田園住居地域', bcr: LOW_BCR, far: LOW_FAR, roadFactor: 0.4, absHeight: [10, 12], northSlope: [5, 1.25], housingAllowed: true },
  { id: 'r1m', name: '第一種中高層住居専用地域', bcr: LOW_BCR, far: MID_FAR, roadFactor: 0.4, absHeight: null, northSlope: [10, 1.25], housingAllowed: true },
  { id: 'r2m', name: '第二種中高層住居専用地域', bcr: LOW_BCR, far: MID_FAR, roadFactor: 0.4, absHeight: null, northSlope: [10, 1.25], housingAllowed: true },
  { id: 'r1', name: '第一種住居地域', bcr: [50, 60, 80], far: MID_FAR, roadFactor: 0.4, absHeight: null, northSlope: null, housingAllowed: true },
  { id: 'r2', name: '第二種住居地域', bcr: [50, 60, 80], far: MID_FAR, roadFactor: 0.4, absHeight: null, northSlope: null, housingAllowed: true },
  { id: 'rq', name: '準住居地域', bcr: [50, 60, 80], far: MID_FAR, roadFactor: 0.4, absHeight: null, northSlope: null, housingAllowed: true },
  { id: 'cn', name: '近隣商業地域', bcr: [60, 80], far: MID_FAR, roadFactor: 0.6, absHeight: null, northSlope: null, housingAllowed: true },
  { id: 'c', name: '商業地域', bcr: [80], far: [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300], roadFactor: 0.6, absHeight: null, northSlope: null, housingAllowed: true },
  { id: 'iq', name: '準工業地域', bcr: [50, 60, 80], far: MID_FAR, roadFactor: 0.6, absHeight: null, northSlope: null, housingAllowed: true },
  { id: 'i', name: '工業地域', bcr: [50, 60], far: [100, 150, 200, 300, 400], roadFactor: 0.6, absHeight: null, northSlope: null, housingAllowed: true },
  { id: 'ie', name: '工業専用地域', bcr: [30, 40, 50, 60], far: [100, 150, 200, 300, 400], roadFactor: 0.6, absHeight: null, northSlope: null, housingAllowed: false },
];

export function zoneById(id: ZoneId): Zone {
  const z = ZONES.find((z) => z.id === id);
  if (!z) throw new Error(`unknown zone: ${id}`);
  return z;
}

export interface VolumeInput {
  siteArea: number; // 敷地面積（㎡、セットバック前）
  zone: ZoneId;
  bcr: number; // 指定建ぺい率（%）
  far: number; // 指定容積率（%）
  roadWidth: number; // 前面道路の幅（m）
  frontage: number; // 道路に接する長さ（m）
  corner: boolean; // 角地の指定を受けている
}

export type Limiter = 'designated' | 'road';

export interface VolumeResult {
  buildable: boolean;
  reasons: string[];
  setbackDepth: number; // m
  setbackArea: number; // ㎡
  effectiveSite: number; // ㎡
  bcrApplied: number; // %
  maxBuildingArea: number; // ㎡
  roadFar: number | null; // % （12m 以上なら null）
  farApplied: number; // %
  limiter: Limiter;
  maxFloorArea: number; // ㎡
}

/** 2項道路（幅4m未満）は中心線から2mまで後退する。道路の反対側が川やがけの場合などは扱わない */
export function setbackDepth(roadWidth: number): number {
  if (roadWidth >= 4) return 0;
  return Math.max(0, (4 - roadWidth) / 2);
}

export function computeVolume(input: VolumeInput): VolumeResult {
  const zone = zoneById(input.zone);
  const reasons: string[] = [];
  let buildable = true;
  if (!zone.housingAllowed) {
    buildable = false;
    reasons.push('工業専用地域には住宅を建てられません');
  }
  if (input.frontage < 2) {
    buildable = false;
    reasons.push('道路に2m以上接していません（接道義務）');
  }

  const depth = setbackDepth(input.roadWidth);
  const setbackArea = Math.min(input.siteArea, depth * Math.max(0, input.frontage));
  const effectiveSite = Math.max(0, input.siteArea - setbackArea);

  const bcrApplied = Math.min(100, input.bcr + (input.corner ? 10 : 0));
  const maxBuildingArea = (effectiveSite * bcrApplied) / 100;

  // 2項道路は後退後の幅（4m）として扱う
  const widthForFar = input.roadWidth < 4 ? 4 : input.roadWidth;
  const roadFar = widthForFar < 12 ? Math.round(widthForFar * zone.roadFactor * 100 * 10) / 10 : null;
  const farApplied = roadFar !== null ? Math.min(input.far, roadFar) : input.far;
  const limiter: Limiter = roadFar !== null && roadFar < input.far ? 'road' : 'designated';
  const maxFloorArea = (effectiveSite * farApplied) / 100;

  return {
    buildable,
    reasons,
    setbackDepth: depth,
    setbackArea,
    effectiveSite,
    bcrApplied,
    maxBuildingArea: buildable ? maxBuildingArea : 0,
    roadFar,
    farApplied,
    limiter,
    maxFloorArea: buildable ? maxFloorArea : 0,
  };
}
