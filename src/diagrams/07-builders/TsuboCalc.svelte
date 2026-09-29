<script lang="ts">
  // 図7-1 坪単価の分母と分子
  import { Tween } from 'svelte/motion';
  import { tweenOpts } from '../shared/tween';
  import { tsuboBreakdown, type Denominator, type Numerator } from '../../lib/tsubo';
  import { num } from '../../lib/format';

  interface Props {
    refs: { label: string; value: number }[];
  }
  let { refs }: Props = $props();

  // 仮定値（利用者が設定）
  let floorTsubo = $state(35);
  let markup = $state(15);
  let body = $state(2800);
  let ancillaryPct = $state(20);
  let miscPct = $state(10);
  let numerator = $state<Numerator>('body');
  let denominator = $state<Denominator>('construction');

  const res = $derived(tsuboBreakdown({ floorTsubo, constructionMarkupPct: markup, body, ancillaryPct, miscPct, numerator, denominator }));
  const priceT = new Tween(
    tsuboBreakdown({ floorTsubo: 35, constructionMarkupPct: 15, body: 2800, ancillaryPct: 20, miscPct: 10, numerator: 'body', denominator: 'construction' }).price,
    tweenOpts,
  );
  $effect(() => {
    priceT.target = res.price;
  });

  const MIN = 50;
  const MAX = 160;
  const p = (v: number) => `${Math.max(0, Math.min(100, ((v - MIN) / (MAX - MIN)) * 100))}%`;

  const NUMS: { id: Numerator; label: string }[] = [
    { id: 'body', label: '本体工事のみ' },
    { id: 'withAncillary', label: '＋付帯工事' },
    { id: 'withMisc', label: '＋諸費用' },
  ];
  const DENS: { id: Denominator; label: string }[] = [
    { id: 'floor', label: '延床面積' },
    { id: 'construction', label: '施工床面積' },
  ];
</script>

<div class="ix">
  <div class="ix-controls">
    <fieldset>
      <legend>分子（何の金額か）</legend>
      <div class="seg" role="group" aria-label="分子">
        {#each NUMS as n}
          <button type="button" aria-pressed={numerator === n.id} onclick={() => (numerator = n.id)}>{n.label}</button>
        {/each}
      </div>
    </fieldset>
    <fieldset>
      <legend>分母（どの面積で割るか）</legend>
      <div class="seg" role="group" aria-label="分母">
        {#each DENS as d}
          <button type="button" aria-pressed={denominator === d.id} onclick={() => (denominator = d.id)}>{d.label}</button>
        {/each}
      </div>
    </fieldset>
    <div>
      <label class="ctl-label" for="ts-floor">延床面積 <output>{floorTsubo}坪（{num(floorTsubo * 3.305785, 1)}㎡）</output></label>
      <input id="ts-floor" type="range" min="20" max="60" step="1" bind:value={floorTsubo} />
    </div>
    <div>
      <label class="ctl-label" for="ts-body">本体工事費（仮定） <output>{num(body)}万円</output></label>
      <input id="ts-body" type="range" min="1000" max="6000" step="50" bind:value={body} />
    </div>
    <div>
      <label class="ctl-label" for="ts-markup">施工床面積の上乗せ（ポーチ・バルコニー・吹抜けなど） <output>+{markup}%</output></label>
      <input id="ts-markup" type="range" min="0" max="40" step="1" bind:value={markup} />
    </div>
    <div>
      <label class="ctl-label" for="ts-anc">付帯工事（本体に対する割合・仮定） <output>{ancillaryPct}%</output></label>
      <input id="ts-anc" type="range" min="0" max="40" step="1" bind:value={ancillaryPct} />
    </div>
    <div>
      <label class="ctl-label" for="ts-misc">諸費用（本体に対する割合・仮定） <output>{miscPct}%</output></label>
      <input id="ts-misc" type="range" min="0" max="20" step="1" bind:value={miscPct} />
    </div>
  </div>

  <div class="ix-out">
    <p class="big" aria-live="polite">
      <span class="lbl">この条件の坪単価</span>
      <span class="num">{num(priceT.current, 1)}</span><span class="u">万円/坪</span>
    </p>
    <p class="fraction">
      <span>{NUMS.find((n) => n.id === numerator)?.label} {num(res.numerator)}万円</span>
      <span class="bar"></span>
      <span>{DENS.find((d) => d.id === denominator)?.label} {num(res.denominator, 1)}坪</span>
    </p>

    <div class="scale" aria-hidden="true">
      <div class="track"></div>
      <span class="range" style="left:{p(res.min)};width:calc({p(res.max)} - {p(res.min)})"></span>
      {#each refs as r, i}
        <span class="ref" style="left:{p(r.value)}">
          <span class="ref-l" class:low={i % 2 === 1}>{r.label} {r.value}</span>
        </span>
      {/each}
      <span class="cur" style="left:{p(priceT.current)}"></span>
      <span class="tick l">{MIN}</span>
      <span class="tick r">{MAX}万円/坪</span>
    </div>
    <p class="ix-note">
      同じ家でも、分子と分母の取り方だけで <b>{num(res.min, 1)}〜{num(res.max, 1)}万円/坪</b> の幅（帯）が出ます。総額は {num(res.total)}万円で変わりません。
    </p>
    <p class="ix-note">
      背景の目盛りは当方算出の参考値：フラット35（注文住宅・土地付注文住宅）は建設費÷住宅面積、業界団体調査（大手中心）は建築費÷延床、民間調査は建築費÷延床。<span class="warn">定義と母集団が違う計算値で、横並びの優劣比較には使えません。</span>本体・付帯・諸費用の配分と上乗せ率は仮定値です。
    </p>
  </div>
</div>

<style>
  .big {
    margin: 0;
  }

  .big .lbl {
    display: block;
    font-size: 0.8rem;
    color: var(--mute);
  }

  .big .num {
    font-size: clamp(2.4rem, 2rem + 2vw, 3.4rem);
    font-weight: 800;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }

  .big .u {
    margin-left: 0.3rem;
  }

  .fraction {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.85rem;
    margin: 0.5rem 0 1rem;
  }

  .fraction .bar {
    width: 100%;
    border-top: 1px solid var(--ink);
    margin: 0.15rem 0;
  }

  .scale {
    position: relative;
    height: 96px;
    margin: 0.5rem 1rem 0.5rem;
  }

  .track {
    position: absolute;
    left: 0;
    right: 0;
    top: 48px;
    border-top: 1px solid var(--ink);
  }

  .range {
    position: absolute;
    top: 42px;
    height: 12px;
    background: var(--accent-soft);
  }

  .ref {
    position: absolute;
    top: 38px;
    height: 20px;
    border-left: 1px dashed var(--mute);
  }

  .ref-l {
    position: absolute;
    bottom: 24px;
    left: 0;
    transform: translateX(-50%);
    font-size: 0.68rem;
    color: var(--mute);
    white-space: nowrap;
  }

  .ref-l.low {
    bottom: auto;
    top: 24px;
  }

  .cur {
    position: absolute;
    top: 36px;
    width: 3px;
    height: 24px;
    margin-left: -1.5px;
    background: var(--accent);
  }

  .tick {
    position: absolute;
    bottom: 0;
    font-size: 0.68rem;
    color: var(--mute);
  }

  .tick.l {
    left: 0;
  }

  .tick.r {
    right: 0;
  }
</style>
