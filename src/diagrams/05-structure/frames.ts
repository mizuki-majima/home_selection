// 5種類の骨組みを分解アクソメの線画として組み立てる（ビルド時に path を生成）
import { boxPath, linePath, pathOf, planePath, type Vec3 } from '../../lib/iso';

export interface Member {
  label: string;
  d: string;
  accent?: boolean;
}

export interface Frame {
  id: string;
  name: string;
  members: Member[];
}

const W = 8; // 間口（x）
const D = 6; // 奥行（y）
const H = 2.8; // 階高
const GAP = 1.1; // 分解のすき間
const S = 20; // 1単位の px

const Z_FOUND = 0;
const Z_1F = 0.4 + GAP;
const Z_2FLOOR = Z_1F + H + GAP;
const Z_2F = Z_2FLOOR + 0.3 + GAP * 0.4;
const Z_ROOF = Z_2F + H + GAP;

const join = (...ds: string[]) => ds.join(' ');

function foundation(): Member {
  // 外周の立ち上がりと、内部の基礎の線
  return {
    label: '基礎',
    d: join(
      boxPath([0, 0, Z_FOUND], [W, D, 0.4], S),
      linePath([0, 3, Z_FOUND + 0.4], [W, 3, Z_FOUND + 0.4], S),
      linePath([4, 0, Z_FOUND + 0.4], [4, D, Z_FOUND + 0.4], S),
    ),
  };
}

function frameOutline(z: number): string {
  return planePath([0, 0, z], [W, D], S);
}

function posts(z: number, xs: number[], ys: number[], h = H): string {
  const ds: string[] = [];
  for (const x of xs) {
    ds.push(linePath([x, 0, z], [x, 0, z + h], S));
    ds.push(linePath([x, D, z], [x, D, z + h], S));
  }
  for (const y of ys) {
    ds.push(linePath([0, y, z], [0, y, z + h], S));
    ds.push(linePath([W, y, z], [W, y, z + h], S));
  }
  return join(...ds);
}

/** 外周の壁面に筋かい（またはブレース）を入れる。x は x 方向の区画、y は y 方向の区画 */
function braces(z: number, bays: Array<[Vec3, Vec3]>, cross = false): string {
  const ds: string[] = [];
  for (const [a, b] of bays) {
    const bottomA: Vec3 = [a[0], a[1], z];
    const topB: Vec3 = [b[0], b[1], z + H];
    ds.push(linePath(bottomA, topB, S));
    if (cross) {
      ds.push(linePath([b[0], b[1], z], [a[0], a[1], z + H], S));
    }
  }
  return join(...ds);
}

function gableRoof(z: number, rafterXs: number[]): string {
  const ridge = 2.2;
  const ds = rafterXs.map((x) =>
    pathOf(
      [
        [x, 0, z],
        [x, D / 2, z + ridge],
        [x, D, z],
      ],
      S,
    ),
  );
  ds.push(linePath([0, D / 2, z + ridge], [W, D / 2, z + ridge], S));
  ds.push(linePath([0, 0, z], [W, 0, z], S));
  ds.push(linePath([0, D, z], [W, D, z], S));
  return join(...ds);
}

function wallPanels(z: number, studStep: number): string {
  const ds: string[] = [];
  // 4面の壁パネルの外形
  ds.push(pathOf([[0, 0, z], [W, 0, z], [W, 0, z + H], [0, 0, z + H]], S, true));
  ds.push(pathOf([[0, D, z], [W, D, z], [W, D, z + H], [0, D, z + H]], S, true));
  ds.push(pathOf([[0, 0, z], [0, D, z], [0, D, z + H], [0, 0, z + H]], S, true));
  ds.push(pathOf([[W, 0, z], [W, D, z], [W, D, z + H], [W, 0, z + H]], S, true));
  // 手前2面のスタッド
  for (let x = studStep; x < W; x += studStep) ds.push(linePath([x, D, z], [x, D, z + H], S));
  for (let y = studStep; y < D; y += studStep) ds.push(linePath([W, y, z], [W, y, z + H], S));
  return join(...ds);
}

function platform(z: number, step: number): string {
  const ds = [boxPath([0, 0, z], [W, D, 0.25], S)];
  for (let x = step; x < W; x += step) ds.push(linePath([x, 0, z + 0.25], [x, D, z + 0.25], S));
  return join(...ds);
}

function steelBox(x: number, y: number, z: number, h: number, size: number): string {
  return boxPath([x - size / 2, y - size / 2, z], [size, size, h], S);
}

function steelBeams(z: number, size: number): string {
  return join(
    boxPath([0, -size / 2, z - size], [W, size, size], S),
    boxPath([0, D - size / 2, z - size], [W, size, size], S),
    boxPath([-size / 2, 0, z - size], [size, D, size], S),
    boxPath([W - size / 2, 0, z - size], [size, D, size], S),
    boxPath([W / 2 - size / 2, 0, z - size], [size, D, size], S),
  );
}

function flatSlab(z: number, t: number): string {
  return boxPath([0, 0, z], [W, D, t], S);
}

function rcWalls(z: number): string {
  const ds: string[] = [];
  ds.push(boxPath([0, D - 0.2, z], [W, 0.2, H], S));
  ds.push(boxPath([W - 0.2, 0, z], [0.2, D, H], S));
  ds.push(pathOf([[0, 0, z], [W, 0, z], [W, 0, z + H], [0, 0, z + H]], S, true));
  ds.push(pathOf([[0, 0, z], [0, D, z], [0, D, z + H], [0, 0, z + H]], S, true));
  // 開口
  ds.push(pathOf([[1.2, D, z + 0.9], [3.2, D, z + 0.9], [3.2, D, z + 2.2], [1.2, D, z + 2.2]], S, true));
  ds.push(pathOf([[5, D, z + 0.9], [6.8, D, z + 0.9], [6.8, D, z + 2.2], [5, D, z + 2.2]], S, true));
  ds.push(pathOf([[W, 1.5, z + 0.9], [W, 4.2, z + 0.9], [W, 4.2, z + 2.2], [W, 1.5, z + 2.2]], S, true));
  return join(...ds);
}

const XS = [0, 2, 4, 6, 8];
const YS = [3];

export const FRAMES: Frame[] = [
  {
    id: 'jiku',
    name: '在来軸組（木造）',
    members: [
      foundation(),
      { label: '土台', d: frameOutline(Z_1F) },
      { label: '1階の柱', d: posts(Z_1F, XS, YS) },
      {
        label: '筋かい',
        accent: true,
        d: braces(Z_1F, [
          [[0, D, 0], [2, D, 0]],
          [[6, D, 0], [8, D, 0]],
          [[W, 0, 0], [W, 3, 0]],
        ]),
      },
      { label: '胴差し・床梁', d: join(frameOutline(Z_1F + H), linePath([4, 0, Z_1F + H], [4, D, Z_1F + H], S)) },
      { label: '2階の柱', d: posts(Z_2F, XS, YS) },
      {
        label: '2階の筋かい',
        accent: true,
        d: braces(Z_2F, [
          [[2, D, 0], [4, D, 0]],
          [[W, 3, 0], [W, 6, 0]],
        ]),
      },
      { label: '桁・梁', d: frameOutline(Z_2F + H) },
      { label: '小屋組', d: gableRoof(Z_ROOF, [0, 2, 4, 6, 8]) },
    ],
  },
  {
    id: 'twobyfour',
    name: 'ツーバイフォー（木造枠組壁工法）',
    members: [
      foundation(),
      { label: '1階の床', d: platform(Z_1F - 0.3, 1) },
      { label: '1階の壁パネル', d: wallPanels(Z_1F, 0.8) },
      { label: '2階の床', d: platform(Z_2FLOOR, 1), accent: true },
      { label: '2階の壁パネル', d: wallPanels(Z_2F, 0.8) },
      { label: '屋根', d: gableRoof(Z_ROOF, [0, 1, 2, 3, 4, 5, 6, 7, 8]) },
    ],
  },
  {
    id: 'steel-prefab',
    name: '鉄骨プレハブ（軽量鉄骨）',
    members: [
      foundation(),
      { label: '1階の柱', d: posts(Z_1F, [0, 2.7, 5.4, 8], [3]) },
      {
        label: 'ブレース',
        accent: true,
        d: braces(
          Z_1F,
          [
            [[0, D, 0], [2.7, D, 0]],
            [[5.4, D, 0], [8, D, 0]],
            [[W, 0, 0], [W, 3, 0]],
          ],
          true,
        ),
      },
      { label: '梁', d: frameOutline(Z_1F + H) },
      { label: '2階の柱', d: posts(Z_2F, [0, 2.7, 5.4, 8], [3]) },
      {
        label: '2階のブレース',
        accent: true,
        d: braces(
          Z_2F,
          [
            [[2.7, D, 0], [5.4, D, 0]],
            [[W, 3, 0], [W, 6, 0]],
          ],
          true,
        ),
      },
      { label: '梁', d: frameOutline(Z_2F + H) },
      { label: '屋根', d: gableRoof(Z_ROOF, [0, 2.7, 5.4, 8]) },
    ],
  },
  {
    id: 'steel-rahmen',
    name: '重量鉄骨ラーメン',
    members: [
      foundation(),
      {
        label: '1階の柱',
        accent: true,
        d: join(...[0, 4, 8].flatMap((x) => [steelBox(x, 0, Z_1F, H, 0.35), steelBox(x, D, Z_1F, H, 0.35)])),
      },
      { label: '大梁', d: steelBeams(Z_1F + H, 0.35) },
      {
        label: '2階の柱',
        accent: true,
        d: join(...[0, 4, 8].flatMap((x) => [steelBox(x, 0, Z_2F, H, 0.35), steelBox(x, D, Z_2F, H, 0.35)])),
      },
      { label: '大梁', d: steelBeams(Z_2F + H, 0.35) },
      { label: '屋根', d: flatSlab(Z_ROOF - 0.4, 0.3) },
    ],
  },
  {
    id: 'rc',
    name: '鉄筋コンクリート（RC）壁式',
    members: [
      foundation(),
      { label: '1階の壁', d: rcWalls(Z_1F) },
      { label: '2階の床スラブ', d: flatSlab(Z_2FLOOR, 0.3), accent: true },
      { label: '2階の壁', d: rcWalls(Z_2F) },
      { label: '屋根スラブ', d: flatSlab(Z_ROOF - 0.4, 0.3), accent: true },
    ],
  },
];

// 表示範囲（全フレーム共通の viewBox）
const minX = -D * 0.866 * S - 20;
const maxX = W * 0.866 * S + 20;
const minY = -(Z_ROOF + 2.4) * S - 10;
const maxY = ((W + D) * 0.5 + 0.2) * S + 10;
export const VIEWBOX = `${minX.toFixed(0)} ${minY.toFixed(0)} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}`;
