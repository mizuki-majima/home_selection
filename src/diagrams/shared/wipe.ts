// 章遷移のワイプ。テラコッタの面が横切る間にページを入れ替える。
import { prefersReducedMotion } from './motion';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function setupWipe() {
  const root = document.documentElement;
  let wiping = false;

  document.addEventListener('astro:before-preparation', (event) => {
    if (prefersReducedMotion()) return;
    const original = event.loader;
    event.loader = async () => {
      wiping = true;
      root.classList.remove('wipe-out');
      root.classList.add('wipe-in');
      await Promise.all([original(), wait(340)]);
    };
  });

  document.addEventListener('astro:after-swap', () => {
    if (!wiping) return;
    wiping = false;
    // swap で html の class は新しいページのものに置き換わるため付け直してから抜く
    root.classList.add('wipe-in');
    requestAnimationFrame(() => {
      root.classList.remove('wipe-in');
      root.classList.add('wipe-out');
      setTimeout(() => root.classList.remove('wipe-out'), 460);
    });
  });
}
