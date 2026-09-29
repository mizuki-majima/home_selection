// アイソメ投影。x は右奥、y は左奥、z は上。1単位 = scale px。

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

export function project([x, y, z]: Vec3, scale = 1): Vec2 {
  return [(x - y) * COS30 * scale, ((x + y) * SIN30 - z) * scale];
}

export function pathOf(points: Vec3[], scale = 1, close = false): string {
  const d = points
    .map((p, i) => {
      const [px, py] = project(p, scale);
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(' ');
  return close ? `${d} Z` : d;
}

/** 直方体の見える稜線（上面・手前2面） */
export function boxPath([x, y, z]: Vec3, [w, d, h]: Vec3, scale = 1): string {
  const p = (dx: number, dy: number, dz: number): Vec3 => [x + dx, y + dy, z + dz];
  const top = pathOf([p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h)], scale, true);
  const right = pathOf([p(w, 0, 0), p(w, 0, h), p(w, d, h), p(w, d, 0)], scale, true);
  const left = pathOf([p(0, d, 0), p(w, d, 0), p(w, d, h), p(0, d, h)], scale, true);
  return `${top} ${right} ${left}`;
}

/** 水平な長方形（床・スラブ用） */
export function planePath([x, y, z]: Vec3, [w, d]: [number, number], scale = 1): string {
  return pathOf([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], scale, true);
}

/** 線分 */
export function linePath(a: Vec3, b: Vec3, scale = 1): string {
  return pathOf([a, b], scale);
}
