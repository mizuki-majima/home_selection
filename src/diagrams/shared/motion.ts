export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 線描アニメーションの準備：path の長さを dasharray に設定する */
export function prepareStroke(el: SVGGeometryElement): number {
  let len = 0;
  try {
    len = el.getTotalLength();
  } catch {
    len = 0;
  }
  el.style.strokeDasharray = `${len} ${len}`;
  el.style.strokeDashoffset = `${len}`;
  return len;
}
