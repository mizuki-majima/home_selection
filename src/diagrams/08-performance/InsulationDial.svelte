<script lang="ts">
  // 図8-3 地域×等級 断熱ダイヤル
  interface Props {
    /** ua[`g${grade}r${region}`] = UA 基準値（1〜7地域） */
    ua: Record<string, number>;
    /** モデル計算の暖冷房一次エネルギー（6地域・2地域） */
    energy: Record<string, number>;
    /** 6地域の最低室温の目安 */
    temp: Record<string, number>;
  }
  let { ua, energy, temp }: Props = $props();

  let region = $state(6);
  let grade = $state(5);

  const REGIONS = [1, 2, 3, 4, 5, 6, 7, 8];
  const GRADES = [4, 5, 6, 7];
  const REGION_HINT: Record<number, string> = {
    1: '旭川など',
    2: '札幌など',
    3: '盛岡など',
    4: '仙台など',
    5: '宇都宮など',
    6: '東京・大阪など',
    7: '宮崎など',
    8: '那覇など',
  };

  const uaVal = $derived(region <= 7 ? ua[`g${grade}r${region}`] : undefined);
  const hasModel = $derived(region === 6 || region === 2);
  const pct = (g: number) => (g === 4 ? 0 : energy[`r${region}g${g}pct`]);
  const tempVal = $derived(region === 6 ? temp[`g${grade}`] : undefined);

  // ダイヤルの角度（等級4〜7 を -60°〜+60°）
  const angle = $derived(-60 + (grade - 4) * 40);
  // UA 基準の目盛（小さいほど高断熱）：0.9 → 0.2
  const uaPos = (v: number) => ((0.9 - v) / 0.7) * 100;
</script>

<div class="ix">
  <div class="ix-controls">
    <fieldset>
      <legend>地域区分</legend>
      <div class="seg regions" role="group" aria-label="地域区分">
        {#each REGIONS as r}
          <button type="button" aria-pressed={region === r} onclick={() => (region = r)} title={REGION_HINT[r]}>{r}</button>
        {/each}
      </div>
      <p class="ix-note" style="margin-top:0.3rem">{region}地域：{REGION_HINT[region]}（市町村ごとに告示で決まる）</p>
    </fieldset>
    <fieldset>
      <legend>断熱等性能等級</legend>
      <div class="seg" role="group" aria-label="断熱等性能等級">
        {#each GRADES as g}
          <button type="button" aria-pressed={grade === g} onclick={() => (grade = g)}>等級{g}</button>
        {/each}
      </div>
    </fieldset>
    <svg class="dial" viewBox="-110 -110 220 130" aria-hidden="true">
      <path class="ln-rule" d="M -95 0 A 95 95 0 0 1 95 0" />
      {#each GRADES as g, i}
        {@const a = ((-60 + i * 40 - 90) * Math.PI) / 180}
        <line class="ln-thin" x1={Math.cos(a) * 82} y1={Math.sin(a) * 82} x2={Math.cos(a) * 95} y2={Math.sin(a) * 95} />
        <text x={Math.cos(a) * 70} y={Math.sin(a) * 70 + 4} font-size="12" text-anchor="middle">{g}</text>
      {/each}
      <line class="ln-accent needle" x1="0" y1="0" x2="0" y2="-88" style="transform: rotate({angle}deg)" />
      <circle r="5" class="dot-accent" />
    </svg>
  </div>

  <div class="ix-out">
    <dl class="ix-readout">
      <div>
        <dt>UA値の基準（W/㎡K）</dt>
        <dd class="accent">
          {#if region === 8}
            基準値なし
          {:else if uaVal === undefined}
            —
          {:else}
            {uaVal.toFixed(2)} 以下
          {/if}
        </dd>
      </div>
      <div>
        <dt>冬の最低室温の目安（6地域）</dt>
        <dd>{tempVal !== undefined ? `おおむね${tempVal}℃` : region === 6 ? '資料になし' : '—'}</dd>
      </div>
    </dl>
    {#if region === 8}
      <p class="ix-note">8地域はUA値の基準値が設定されていません（このサイトの資料の表は1〜7地域）。8地域に等級7はありません。</p>
    {/if}

    {#if region <= 7}
      <div class="ua-scale" aria-hidden="true">
        <div class="ua-track"></div>
        {#each GRADES as g}
          {@const v = ua[`g${g}r${region}`]}
          <span class="ua-mark" class:on={g === grade} style="left:{uaPos(v)}%">
            <span class="ua-g">等級{g}</span>
            <span class="ua-v">{v.toFixed(2)}</span>
          </span>
        {/each}
        <span class="ua-end l">断熱が弱い</span>
        <span class="ua-end r">断熱が強い</span>
      </div>
    {/if}

    <div class="energy">
      <p class="e-title">暖冷房の一次エネルギー（等級4＝100 としたモデル計算）</p>
      {#if hasModel}
        {#each GRADES as g}
          {@const p = pct(g)}
          <div class="e-row" class:on={g === grade}>
            <span class="e-label">等級{g}</span>
            <span class="e-bar"><span style="width:{100 - p}%"></span></span>
            <span class="e-val">{g === 4 ? '100' : `${100 - p}（−${p}%）`}{g !== 4 ? ` ${energy[`r${region}g${g}`]}GJ` : ''}</span>
          </div>
        {/each}
      {:else}
        <p class="ix-note">この地域のモデル値は、このサイトの資料にありません（6地域と2地域のみ）。</p>
      {/if}
    </div>
    <p class="ix-note">モデル計算による値で、実測値ではありません。円額は単価と住まい方で変わるため、比べるなら同じ条件の「目安光熱費」を使います。</p>
  </div>
</div>

<style>
  .regions button {
    padding: 8px 12px;
    min-width: 40px;
  }

  .dial {
    width: 100%;
    max-width: 240px;
    margin: 0 auto;
    display: block;
  }

  .needle {
    transition: transform 0.45s var(--ease-out);
    transform-origin: 0 0;
  }

  .ua-scale {
    position: relative;
    height: 74px;
    margin: 1.2rem 1.5rem 0.5rem;
  }

  .ua-track {
    position: absolute;
    left: 0;
    right: 0;
    top: 30px;
    border-top: 1px solid var(--ink);
  }

  .ua-mark {
    position: absolute;
    top: 22px;
    width: 0;
    height: 16px;
    border-left: 1.5px solid var(--mute);
    transition: left 0.45s var(--ease-out);
  }

  .ua-mark.on {
    border-left-color: var(--accent);
    border-left-width: 2px;
  }

  .ua-g,
  .ua-v {
    position: absolute;
    left: 0;
    transform: translateX(-50%);
    font-size: 0.72rem;
    white-space: nowrap;
  }

  .ua-g {
    bottom: 18px;
    color: var(--mute);
  }

  .ua-v {
    top: 18px;
    font-variant-numeric: tabular-nums;
  }

  .ua-mark.on .ua-g,
  .ua-mark.on .ua-v {
    color: var(--accent);
    font-weight: 700;
  }

  .ua-end {
    position: absolute;
    bottom: -4px;
    font-size: 0.7rem;
    color: var(--mute);
  }

  .ua-end.l {
    left: -1rem;
  }

  .ua-end.r {
    right: -1rem;
  }

  .energy {
    margin-top: 1.5rem;
  }

  .e-title {
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }

  .e-row {
    display: grid;
    grid-template-columns: 3.5rem 1fr auto;
    gap: 0.6rem;
    align-items: center;
    font-size: 0.82rem;
    min-height: 28px;
  }

  .e-bar {
    height: 12px;
    background: var(--paper-deep);
  }

  .e-bar span {
    display: block;
    height: 100%;
    background: var(--mute);
    transition: width 0.45s var(--ease-out);
  }

  .e-row.on .e-bar span {
    background: var(--accent);
  }

  .e-row.on {
    font-weight: 700;
  }

  .e-val {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .needle,
    .ua-mark,
    .e-bar span {
      transition: none;
    }
  }
</style>
