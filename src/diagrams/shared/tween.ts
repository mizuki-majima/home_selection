import { cubicOut } from 'svelte/easing';

// reduced-motion のときは補間しない
export const tweenOpts = {
  duration: () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450,
  easing: cubicOut,
};
