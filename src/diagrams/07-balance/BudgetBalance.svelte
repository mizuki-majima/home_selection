<script lang="ts">
  // 図7-3 総予算の天秤：1本の帯の上で土地と建物の境目が動く
  import { Tween } from 'svelte/motion';
  import { tweenOpts } from '../shared/tween';
  import { allocate } from '../../lib/budget';
  import { num } from '../../lib/format';
  import { sqmToTsubo } from '../../lib/tsubo';

  interface Region {
    id: string;
    name: string;
    landUnit: number;
    buildUnit: number;
    site: number;
  }
  interface Grade {
    id: string;
    name: string;
    limit: number;
    note: string;
  }

  interface Props {
    regions: Region[];
    grades: Grade[];
    initialTotal: number;
    compact?: boolean;
  }

  let { regions, grades, initialTotal, compact = false }: Props = $props();

  let total = $state(initialTotal);
  let regionId = $state(regions[0].id);
  const region = $derived(regions.find((r) => r.id === regionId) ?? regions[0]);
  let landArea = $state(regions[0].site);
  let gradeId = $state(grades[1]?.id ?? grades[0].id);
  const grade = $derived(grades.find((g) => g.id === gradeId) ?? grades[0]);
  let extra = $state(0);
  let miscPct = $state(0);
  let farPct = $state(150);

  function pickRegion(id: string) {
    regionId = id;
    landArea = regions.find((r) => r.id === id)!.site;
  }

  const res = $derived(
    allocate({
      total,
      landArea,
      landUnit: region.landUnit,
      buildUnit: region.buildUnit,
      performanceExtra: extra,
      miscPct,
      farPct: compact ? undefined : farPct,
    }),
  );

  const init = allocate({ total: initialTotal, landArea: regions[0].site, landUnit: regions[0].landUnit, buildUnit: regions[0].buildUnit, performanceExtra: 0, miscPct: 0 });
  const landT = new Tween(init.land, tweenOpts);
  const floorT = new Tween(init.floorArea, tweenOpts);
  $effect(() => {
    landT.target = Math.min(res.land, total);
    floorT.target = res.floorArea;
  });

  const W = 560;
  const bx = (v: number) => (total > 0 ? (v / total) * W : 0);
  const miscW = $derived(bx(res.misc));
  const landW = $derived(Math.min(bx(landT.current), W - miscW));
  const extraW = $derived(Math.max(0, Math.min(bx(extra), W - miscW - landW)));

  // 方眼の家：1マス＝1坪
  const COLS = 10;
  const cells = $derived(Math.max(0, Math.round(sqmToTsubo(floorT.current))));
</script>

<div class="ix" class:compact>
  <div class="ix-controls">
    <div>
      <label class="ctl-label" for="bb-total">総予算 <output>{num(total)}万円</output></label>
      <input id="bb-total" type="range" min="2000" max="12000" step="50" bind:value={total} />
    </div>
    {#if !compact}
      <fieldset>
        <legend>地域の単価（当方の概算）</legend>
        <div class="seg" role="group" aria-label="地域">
          {#each regions as r}
            <button type="button" aria-pressed={regionId === r.id} onclick={() => pickRegion(r.id)}>{r.name}</button>
          {/each}
        </div>
      </fieldset>
    {/if}
    <div>
      <label class="ctl-label" for="bb-land">敷地面積 <output>{num(landArea)}㎡（{num(sqmToTsubo(landArea), 1)}坪）</output></label>
      <input id="bb-land" type="range" min="50" max="400" step="1" bind:value={landArea} />
    </div>
    {#if !compact}
      <div>
        <label class="ctl-label" for="bb-grade">性能グレード</label>
        <select id="bb-grade" bind:value={gradeId}>
          {#each grades as g}
            <option value={g.id}>{g.name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="ctl-label" for="bb-extra">性能の上乗せ額（あなたの見積り） <output>{num(extra)}万円</output></label>
        <input id="bb-extra" type="range" min="0" max="1000" step="10" bind:value={extra} />
      </div>
      <div>
        <label class="ctl-label" for="bb-misc">諸費用（総予算に対する割合） <output>{miscPct}%</output></label>
        <input id="bb-misc" type="range" min="0" max="12" step="1" bind:value={miscPct} />
      </div>
      <div>
        <label class="ctl-label" for="bb-far">容積率（06章の計算機で確かめた値）</label>
        <select id="bb-far" bind:value={farPct}>
          {#each [50, 60, 80, 100, 150, 200, 300] as v}
            <option value={v}>{v}%</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <div class="ix-out">
    <svg viewBox="-2 -26 {W + 4} 96" role="img" aria-label="総予算{num(total)}万円のうち、土地{num(res.land)}万円、建物{num(res.building)}万円">
      <defs>
        <pattern id="bb-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink)" stroke-width="0.8" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height="34" class="band" />
      {#if miscW > 0}<rect x="0" y="0" width={miscW} height="34" class="misc" />{/if}
      <rect x={miscW} y="0" width={landW} height="34" fill="url(#bb-hatch)" />
      {#if extraW > 0}<rect x={miscW + landW} y="0" width={extraW} height="34" class="extra" />{/if}
      <line class="ln-accent" x1={miscW + landW} y1="-8" x2={miscW + landW} y2="42" />
      <text x={miscW + 4} y="-10" font-size="13" font-weight="700">土地 {num(res.land)}万円</text>
      <text x={W} y="-10" font-size="13" font-weight="700" text-anchor="end" style="fill: var(--accent)">建物 {num(res.building)}万円</text>
      <text x="0" y="60" font-size="11" style="fill: var(--mute)">総予算 {num(total)}万円{res.misc > 0 ? `（うち諸費用 ${num(res.misc)}万円）` : ''}{extra > 0 ? `・性能の上乗せ ${num(extra)}万円` : ''}</text>
    </svg>

    <div class="house" aria-hidden="true">
      <div class="grid" style="--cols:{COLS}">
        {#each Array.from({ length: Math.min(cells, 120) }) as _, i}
          <span class:over={res.overFar && i >= Math.round(sqmToTsubo(res.maxFloorByFar ?? 0))}></span>
        {/each}
      </div>
      <p class="grid-cap">1マス＝1坪（約3.3㎡）{cells > 120 ? '・120坪以上は省略' : ''}</p>
    </div>

    <dl class="ix-readout">
      <div><dt>土地の割合</dt><dd>{num(res.landShare * 100)}%</dd></div>
      <div><dt>建てられる延床の目安</dt><dd class="accent">{num(res.floorArea, 1)}㎡</dd></div>
      {#if !compact}
        <div><dt>減税の借入限度額（2026・27年入居）</dt><dd>{num(grade.limit)}万円</dd></div>
      {/if}
    </dl>
    {#if res.overBudget}<p class="ix-note warn">土地（と上乗せ）だけで予算を超えています。</p>{/if}
    {#if res.overFar}<p class="ix-note warn">容積率{farPct}%では延床は{num(res.maxFloorByFar ?? 0, 1)}㎡まで。予算が余っても、これ以上の広さは建てられません。</p>{/if}
    {#if !compact}
      <p class="ix-note">{grade.note}</p>
      <p class="ix-note">
        単価は{region.name}の土地付注文住宅（フラット35利用者）から当方で概算：土地 {num(region.landUnit, 2)}万円/㎡（土地取得費の平均÷敷地面積の中央値）、建物 {num(region.buildUnit, 2)}万円/㎡（建設費の平均÷住宅面積の平均）。実際の単価は立地・仕様で大きく変わります。
      </p>
    {/if}
  </div>
</div>

<style>
  .band {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.2px;
  }

  .misc {
    fill: var(--rule);
  }

  .extra {
    fill: var(--accent-soft);
  }

  .house {
    margin-top: 0.8rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 3px;
    max-width: 300px;
  }

  .grid span {
    aspect-ratio: 1;
    border: 1px solid var(--ink);
    background: var(--paper);
  }

  .grid span.over {
    border-color: var(--accent);
    border-style: dashed;
    background: transparent;
  }

  .grid-cap {
    font-size: 0.75rem;
    color: var(--mute);
    margin: 0.3rem 0 0;
  }

  .compact {
    grid-template-columns: minmax(0, 1fr);
  }

  .compact .grid {
    max-width: 220px;
  }
</style>
