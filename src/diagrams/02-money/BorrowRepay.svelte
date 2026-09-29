<script lang="ts">
  // 図2-1 借りられる額／返せる額
  import { Tween } from 'svelte/motion';
  import { tweenOpts } from '../shared/tween';
  import { borrowable, burdenRatio, repayable } from '../../lib/loan';
  import { num } from '../../lib/format';

  interface Props {
    example: { income: number; rate: number; years: number };
    presets: { label: string; rate: number }[];
    marks: { label: string; value: number }[];
  }

  let { example, presets, marks }: Props = $props();

  let income = $state(example.income);
  let rate = $state(example.rate);
  let years = $state(example.years);
  // 返せる額の内訳（機構の例の約2,614万円にそろう当方の仮定）
  let rent = $state(8);
  let saving = $state(2);
  let upkeep = $state(1);

  const b = $derived(borrowable({ income, ratePct: rate, years }));
  const r = $derived(repayable({ rent, saving, upkeep, ratePct: rate, years }));
  const rBurden = $derived(burdenRatio(r.monthly, income));

  // SSR（JS 無効時）でも完成形が出るよう、初期値は計算結果にそろえる
  const bT = new Tween(borrowable({ income: example.income, ratePct: example.rate, years: example.years }).amount, tweenOpts);
  const rT = new Tween(repayable({ rent: 8, saving: 2, upkeep: 1, ratePct: example.rate, years: example.years }).amount, tweenOpts);
  $effect(() => {
    bT.target = b.amount;
    rT.target = r.amount;
  });
  const bAmt = $derived(bT.current);
  const rAmt = $derived(rT.current);

  const W = 560;
  const scaleMax = $derived(Math.max(b.amount, r.amount, 1000) * 1.08);
  const x = (v: number) => (v / scaleMax) * W;

  const METER_MAX = 40;
  const mx = (pct: number) => (pct / METER_MAX) * W;
</script>

<div class="ix">
  <div class="ix-controls">
    <div>
      <label class="ctl-label" for="br-income">年収 <output>{num(income)}万円</output></label>
      <input id="br-income" type="range" min="200" max="2000" step="10" bind:value={income} />
    </div>
    <fieldset>
      <legend>金利 <output>{rate.toFixed(2)}%</output></legend>
      <div class="seg" role="group" aria-label="金利のプリセット">
        {#each presets as p}
          <button type="button" aria-pressed={Math.abs(rate - p.rate) < 1e-9} onclick={() => (rate = p.rate)}>{p.label}</button>
        {/each}
      </div>
      <input aria-label="金利（任意入力）" type="range" min="0.3" max="5" step="0.01" bind:value={rate} />
    </fieldset>
    <div>
      <label class="ctl-label" for="br-years">返済期間 <output>{years}年</output></label>
      <input id="br-years" type="range" min="10" max="35" step="1" bind:value={years} />
    </div>
    <div>
      <label class="ctl-label" for="br-rent">いまの家賃 <output>月{num(rent, 1)}万円</output></label>
      <input id="br-rent" type="range" min="0" max="30" step="0.5" bind:value={rent} />
    </div>
    <div>
      <label class="ctl-label" for="br-saving">住宅取得のための貯蓄 <output>月{num(saving, 1)}万円</output></label>
      <input id="br-saving" type="range" min="0" max="20" step="0.5" bind:value={saving} />
    </div>
    <div>
      <label class="ctl-label" for="br-upkeep">入居後の維持費（固定資産税・修繕の積立など） <output>月{num(upkeep, 1)}万円</output></label>
      <input id="br-upkeep" type="range" min="0" max="10" step="0.5" bind:value={upkeep} />
    </div>
  </div>

  <div class="ix-out">
    <svg viewBox="-4 -10 {W + 8} 250" role="img" aria-label="借りられる額は約{num(b.amount)}万円、返せる額は約{num(r.amount)}万円">
      <defs>
        <pattern id="br-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--accent)" stroke-width="1" />
        </pattern>
      </defs>
      <!-- 審査上の上限 -->
      <text x="0" y="8" font-size="13" font-weight="700">借りられる額（審査上の上限）</text>
      <line class="ln" x1="0" y1="24" x2="0" y2="52" />
      <line class="ln" x1={x(bAmt)} y1="24" x2={x(bAmt)} y2="52" />
      <line class="ln" x1="0" y1="38" x2={x(bAmt)} y2="38" />
      <text x={Math.min(x(bAmt), W) - 4} y="33" font-size="15" font-weight="800" text-anchor="end">{num(bAmt)}万円</text>

      <!-- 家計から逆算 -->
      <text x="0" y="92" font-size="13" font-weight="700">返せる額（いまの家計から逆算）</text>
      <line class="ln-accent" x1="0" y1="108" x2="0" y2="136" />
      <line class="ln-accent" x1={x(rAmt)} y1="108" x2={x(rAmt)} y2="136" />
      <line class="ln-accent" x1="0" y1="122" x2={x(rAmt)} y2="122" />
      <text x={Math.max(x(rAmt) + 6, 60)} y="127" font-size="15" font-weight="800" fill="var(--accent)" style="fill: var(--accent)">{num(rAmt)}万円</text>

      <!-- 差 -->
      {#if bAmt > rAmt}
        <rect x={x(rAmt)} y="142" width={x(bAmt) - x(rAmt)} height="14" fill="url(#br-hatch)" />
        <text x={x(bAmt)} y="174" font-size="12" text-anchor="end" style="fill: var(--mute)">差 {num(bAmt - rAmt)}万円</text>
      {/if}

      <!-- 返済負担率メーター -->
      <g transform="translate(0,200)">
        <text x="0" y="-6" font-size="12" style="fill: var(--mute)">返済負担率（年間返済額÷年収）　● 借りられる額　<tspan style="fill: var(--accent)">●</tspan> 返せる額</text>
        <line class="ln-rule" x1="0" y1="10" x2={W} y2="10" />
        {#each marks as m, i}
          <line class="ln-thin" x1={mx(m.value)} y1="4" x2={mx(m.value)} y2="16" />
          <text x={mx(m.value)} y={i % 2 === 0 ? 32 : 46} font-size="10.5" text-anchor="middle" style="fill: var(--mute)">{m.label} {m.value}%</text>
        {/each}
        <circle cx={mx(b.ratio * 100)} cy="10" r="5" fill="var(--ink)" />
        <circle cx={mx(Math.min(rBurden * 100, METER_MAX))} cy="10" r="5" fill="var(--accent)" />
      </g>
    </svg>

    <dl class="ix-readout">
      <div><dt>借りられる額</dt><dd>{num(b.amount)}万円</dd></div>
      <div><dt>返せる額</dt><dd class="accent">{num(r.amount)}万円</dd></div>
      <div><dt>返せる額での負担率</dt><dd class="accent">{(rBurden * 100).toFixed(1)}%</dd></div>
      <div><dt>審査の基準</dt><dd>{(b.ratio * 100).toFixed(0)}%</dd></div>
    </dl>

    <p class="formula-box">
      借りられる額 ＝ 年収 × 基準（400万円未満30%・以上35%）÷ 12 × 係数<br />
      返せる額 ＝（家賃 ＋ 貯蓄 − 維持費）× 係数<br />
      係数 ＝ (1 − (1 + 月利)<sup>−回数</sup>) ÷ 月利　（元利均等返済。いまの係数 {num(b.monthly > 0 ? b.amount / b.monthly : 0, 1)}）
    </p>
    <p class="ix-note">
      <span class="warn">審査の基準 ＝ 安全ライン、ではありません。</span>
      他の借入れはないものとした概算で、保証料・団信・手数料を含みません。家計の内訳の初期値（家賃8万・貯蓄2万・維持費1万）は、機構の試算例の「返せる額」にそろえるため当方が置いた仮定です。
    </p>
  </div>
</div>
