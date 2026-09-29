// スクロール図のアニメーション（GSAP ScrollTrigger、scrub で逆再生可）
// GSAP は描画を妨げないよう、スクロール図があるときだけ後から読み込む
import { prefersReducedMotion, prepareStroke } from './motion';

type Gsap = typeof import('gsap').gsap;
type ST = typeof import('gsap/ScrollTrigger').ScrollTrigger;
let gsap: Gsap;
let ScrollTrigger: ST;

async function loadGsap() {
  if (!gsap) {
    const [g, st] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    gsap = g.gsap;
    ScrollTrigger = st.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
  }
}

let cleanupBound = false;

function initScrolly(root: HTMLElement) {
  if (root.dataset.ready === '1') return;
  root.dataset.ready = '1';
  if (prefersReducedMotion()) return;

  root.classList.add('is-live');
  const steps = Array.from(root.querySelectorAll<HTMLElement>(':scope > .scrolly-steps > li'));
  const stage = root.querySelector<HTMLElement>('.scrolly-stage')!;
  const mode = root.dataset.mode ?? 'build';

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: root.querySelector('.scrolly-steps'),
      start: 'top 55%',
      end: 'bottom 85%',
      scrub: 0.6,
    },
  });

  steps.forEach((li, i) => {
    const k = String(i + 1);
    const t = i;
    if (mode === 'swap') {
      // ステージを段ごとに切り替え、その中の部材を順に組み上げる
      const frame = stage.querySelector<HTMLElement>(`[data-frame="${k}"]`);
      const prev = stage.querySelector<HTMLElement>(`[data-frame="${i}"]`);
      if (prev) tl.to(prev, { autoAlpha: 0, duration: 0.15 }, t);
      if (frame) {
        // 最初の段は下書き線を最初から見せる
        if (i === 0) gsap.set(frame, { autoAlpha: 1 });
        else tl.fromTo(frame, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, t + 0.05);
        const members = Array.from(frame.querySelectorAll<SVGGElement>('.member'));
        members.forEach((m, j) => {
          const at = t + 0.1 + (j / Math.max(members.length, 1)) * 0.75;
          tl.from(m, { y: -60, autoAlpha: 0, duration: 0.25 }, at);
          m.querySelectorAll<SVGGeometryElement>('.draw').forEach((p) => {
            prepareStroke(p);
            tl.to(p, { strokeDashoffset: 0, duration: 0.3, ease: 'none' }, at);
          });
        });
      }
    } else {
      const els = stage.querySelectorAll<SVGElement>(`[data-step="${k}"]`);
      els.forEach((el) => {
        if (el.classList.contains('draw')) {
          prepareStroke(el as unknown as SVGGeometryElement);
          tl.to(el, { strokeDashoffset: 0, duration: 0.8, ease: 'none' }, t);
        } else if (el.classList.contains('drop')) {
          tl.from(el, { y: -40, autoAlpha: 0, duration: 0.6 }, t);
        } else {
          tl.from(el, { autoAlpha: 0, duration: 0.5 }, t + 0.1);
        }
        el.querySelectorAll<SVGGeometryElement>('.draw').forEach((p) => {
          prepareStroke(p);
          tl.to(p, { strokeDashoffset: 0, duration: 0.8, ease: 'none' }, t);
        });
      });
    }
    ScrollTrigger.create({
      trigger: li,
      start: 'top 60%',
      end: 'bottom 60%',
      toggleClass: 'is-active',
    });
  });
  // 最後の段まで進めた長さに揃える
  tl.to({}, { duration: 0.2 }, steps.length);
}

export async function initAllScrolly() {
  const roots = document.querySelectorAll<HTMLElement>('[data-scrolly]:not([data-ready])');
  if (roots.length === 0 || prefersReducedMotion()) return;
  await loadGsap();
  if (!cleanupBound) {
    cleanupBound = true;
    document.addEventListener('astro:before-swap', () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    });
  }
  roots.forEach(initScrolly);
  ScrollTrigger.refresh();
}
