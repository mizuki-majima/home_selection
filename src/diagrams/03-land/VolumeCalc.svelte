<script lang="ts">
  // 図3-1 この土地に、どこまで建つ？
  import { Tween } from 'svelte/motion';
  import { tweenOpts } from '../shared/tween';
  import { ZONES, computeVolume, zoneById, type ZoneId } from '../../lib/volume';
  import { num } from '../../lib/format';

  const PRESETS = [
    { id: 'A', label: '例A', desc: '第一種低層・50%/100%・道路6m', v: { siteArea: 150, zone: 'r1l' as ZoneId, bcr: 50, far: 100, roadWidth: 6, frontage: 10, corner: false } },
    { id: 'B', label: '例B', desc: '第一種住居・60%/200%・道路4m', v: { siteArea: 150, zone: 'r1' as ZoneId, bcr: 60, far: 200, roadWidth: 4, frontage: 10, corner: false } },
    { id: 'C', label: '例C', desc: '第一種住居・60%/200%・幅3mの2項道路', v: { siteArea: 150, zone: 'r1' as ZoneId, bcr: 60, far: 200, roadWidth: 3, frontage: 10, corner: false } },
  ];

  let siteArea = $state(150);
  let zone = $state<ZoneId>('r1');
  let bcr = $state(60);
  let far = $state(200);
  let roadWidth = $state(4);
  let frontage = $state(10);
  let corner = $state(false);
  let preset = $state('B');

  const z = $derived(zoneById(zone));
  const res = $derived(computeVolume({ siteArea, zone, bcr, far, roadWidth, frontage, corner }));

  function applyPreset(p: (typeof PRESETS)[number]) {
    preset = p.id;
    ({ siteArea, zone, bcr, far, roadWidth, frontage, corner } = p.v);
  }

  function onZone() {
    preset = '';
    // その地域で選べない値なら、選べる値に寄せる
    if (!z.bcr.includes(bcr)) bcr = z.bcr[Math.min(1, z.bcr.length - 1)];
    if (!z.far.includes(far)) far = z.far[Math.min(2, z.far.length - 1)];
  }

  // 積み木：建築面積の正方形を、延べ面積に届くまで積む
  const floorT = new Tween(computeVolume(PRESETS[1].v).maxFloorArea, tweenOpts);
  const footT = new Tween(computeVolume(PRESETS[1].v).maxBuildingArea, tweenOpts);
  const siteT = new Tween(computeVolume(PRESETS[1].v).effectiveSite, tweenOpts);
  $effect(() => {
    floorT.target = res.maxFloorArea;
    footT.target = res.maxBuildingArea;
    siteT.target = res.effectiveSite;
  });

  const COS = Math.cos(Math.PI / 6);
  const proj = (x: number, y: number, h: number, s: number) => [(x - y) * COS * s, ((x + y) / 2 - h) * s];
  const pathOf = (pts: number[][]) => 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L') + ' Z';

  const FLOOR_H = 3;
  const view = $derived.by(() => {
    const site = Math.sqrt(Math.max(siteT.current, 1));
    const foot = Math.sqrt(Math.max(footT.current, 0));
    const floors = footT.current > 0 ? floorT.current / footT.current : 0;
    const totalH = floors * FLOOR_H;
    // 収まる縮尺
    const sW = 185 / site;
    const sH = 225 / Math.max(totalH, 1);
    const s = Math.min(sW, sH);
    const off = (site - foot) / 2;
    const blocks: { top: string; right: string; left: string; partial: boolean }[] = [];
    const full = Math.floor(floors);
    const frac = floors - full;
    const n = Math.ceil(floors - 1e-9);
    for (let i = 0; i < n; i++) {
      const h0 = i * FLOOR_H;
      const h1 = h0 + (i < full ? FLOOR_H : frac * FLOOR_H);
      const P = (x: number, y: number, h: number) => proj(off + x, off + y, h, s);
      blocks.push({
        top: pathOf([P(0, 0, h1), P(foot, 0, h1), P(foot, foot, h1), P(0, foot, h1)]),
        right: pathOf([P(foot, 0, h0), P(foot, 0, h1), P(foot, foot, h1), P(foot, foot, h0)]),
        left: pathOf([P(0, foot, h0), P(foot, foot, h0), P(foot, foot, h1), P(0, foot, h1)]),
        partial: i >= full,
      });
    }
    const Q = (x: number, y: number) => proj(x, y, 0, s);
    return {
      site: pathOf([Q(0, 0), Q(site, 0), Q(site, site), Q(0, site)]),
      blocks,
      floors,
      scaled: sH < sW,
    };
  });

  const limiterText = $derived(
    !res.buildable
      ? '建てられません'
      : res.limiter === 'road'
        ? `前面道路の幅（${roadWidth < 4 ? '4m とみなす' : `${roadWidth}m`} × ${z.roadFactor} = ${num(res.roadFar ?? 0)}%）`
        : `指定容積率（${far}%）`,
  );
</script>

<div class="ix">
  <div class="ix-controls">
    <div class="seg" role="group" aria-label="例（自治体の都市計画図で要確認）">
      {#each PRESETS as p}
        <button type="button" aria-pressed={preset === p.id} title={p.desc} onclick={() => applyPreset(p)}>{p.label}</button>
      {/each}
    </div>
    <p class="ix-note" style="margin-top:0">例は説明用です。実際の指定値は自治体の都市計画図で確認してください。</p>
    <div>
      <label class="ctl-label" for="vc-site">敷地面積 <output>{num(siteArea)}㎡（{num(siteArea / 3.305785, 1)}坪）</output></label>
      <input id="vc-site" type="range" min="50" max="400" step="5" bind:value={siteArea} oninput={() => (preset = '')} />
    </div>
    <div>
      <label class="ctl-label" for="vc-zone">用途地域</label>
      <select id="vc-zone" bind:value={zone} onchange={onZone}>
        {#each ZONES as zz}
          <option value={zz.id}>{zz.name}</option>
        {/each}
      </select>
    </div>
    <div class="two">
      <div>
        <label class="ctl-label" for="vc-bcr">指定建ぺい率</label>
        <select id="vc-bcr" bind:value={bcr} onchange={() => (preset = '')}>
          {#each z.bcr as v}
            <option value={v}>{v}%</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="ctl-label" for="vc-far">指定容積率</label>
        <select id="vc-far" bind:value={far} onchange={() => (preset = '')}>
          {#each z.far as v}
            <option value={v}>{v}%</option>
          {/each}
        </select>
      </div>
    </div>
    <div>
      <label class="ctl-label" for="vc-road">前面道路の幅 <output>{roadWidth.toFixed(1)}m{roadWidth < 4 ? '（2項道路）' : ''}</output></label>
      <input id="vc-road" type="range" min="2" max="15" step="0.1" bind:value={roadWidth} oninput={() => (preset = '')} />
    </div>
    <div>
      <label class="ctl-label" for="vc-front">道路に接する長さ（間口） <output>{frontage.toFixed(1)}m</output></label>
      <input id="vc-front" type="range" min="1" max="20" step="0.5" bind:value={frontage} oninput={() => (preset = '')} />
    </div>
    <label class="check"><input type="checkbox" bind:checked={corner} onchange={() => (preset = '')} />角地の指定がある（建ぺい率+10%）</label>
  </div>

  <div class="ix-out">
    <svg viewBox="-200 -235 400 430" role="img" aria-label="最大建築面積{num(res.maxBuildingArea, 1)}㎡、最大延べ面積{num(res.maxFloorArea, 1)}㎡">
      <path d={view.site} class="site" />
      {#each view.blocks as b}
        <g class:partial={b.partial}>
          <path d={b.left} class="face-l" />
          <path d={b.right} class="face-r" />
          <path d={b.top} class="face-t" />
        </g>
      {/each}
      {#if !res.buildable}
        <text x="0" y="-60" text-anchor="middle" font-size="14" class="warn-text">{res.reasons.join('／')}</text>
      {/if}
    </svg>
    {#if view.scaled}<p class="ix-note">縮小して表示しています。</p>{/if}

    <p class="limiter" aria-live="polite"><span>いま効いている制限</span>{limiterText}</p>

    <dl class="ix-readout">
      <div><dt>最大建築面積（1階の広さの上限）</dt><dd>{num(res.maxBuildingArea, 1)}㎡</dd></div>
      <div><dt>最大延べ面積</dt><dd class="accent">{num(res.maxFloorArea, 1)}㎡</dd></div>
      <div><dt>計算に使う敷地面積</dt><dd>{num(res.effectiveSite, 1)}㎡</dd></div>
      <div><dt>適用される容積率</dt><dd>{num(res.farApplied)}%</dd></div>
    </dl>
    {#if res.setbackArea > 0}
      <p class="ix-note"><span class="warn">セットバック</span>：道路の中心線から2mまで {res.setbackDepth.toFixed(2)}m 後退し、{num(res.setbackArea, 1)}㎡は敷地面積に数えません。</p>
    {/if}
    <p class="ix-note">
      高さの制限：{#if z.absHeight}絶対高さ {z.absHeight[0]}m または {z.absHeight[1]}m（都市計画で指定）。{/if}{#if z.northSlope}北側斜線 {z.northSlope[0]}m ＋ 1.25 勾配。{/if}{#if !z.absHeight && !z.northSlope}この地域は絶対高さ・北側斜線の対象外（道路斜線・隣地斜線などは別途）。{/if}
      積み木は1階あたり3mで、建ぺい率いっぱいの床を容積率いっぱいまで積んだ概念図です。
    </p>
  </div>
</div>

<style>
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
  }

  select {
    width: 100%;
  }

  svg {
    max-height: 380px;
  }

  .site {
    fill: var(--paper-deep);
    stroke: var(--ink);
    stroke-width: 1px;
    stroke-dasharray: 4 3;
  }

  .face-t {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.2px;
  }

  .face-r {
    fill: var(--hatch);
    stroke: var(--ink);
    stroke-width: 1.2px;
  }

  .face-l {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.2px;
  }

  .partial .face-t,
  .partial .face-l,
  .partial .face-r {
    stroke: var(--accent);
    stroke-dasharray: 3 2;
  }

  .warn-text {
    fill: var(--accent);
    font-weight: 700;
  }

  .limiter {
    margin: 0.4rem 0 0;
    font-weight: 700;
  }

  .limiter span {
    display: block;
    font-size: 0.78rem;
    color: var(--accent);
    font-weight: 700;
  }
</style>
