export type Level = 1 | 2 | 3;

export interface Chapter {
  num: string;
  slug: string;
  title: string;
  /** 目次に出す1行の問い（やさしい言葉で） */
  question: string;
  lead: string;
  /** 読む順番のまとまり（1 やさしい → 3 むずかしい） */
  step: Level;
}

export const STEPS: Record<Level, { label: string; title: string; note: string }> = {
  1: { label: 'STEP 1', title: 'まず全体をつかむ', note: 'やさしい' },
  2: { label: 'STEP 2', title: '選び方を知る', note: 'ふつう' },
  3: { label: 'STEP 3', title: 'くわしく比べる', note: 'むずかしい' },
};

export const LEVEL_LABEL: Record<Level, string> = {
  1: 'やさしい',
  2: 'ふつう',
  3: 'くわしい',
};

export const CHAPTERS: Chapter[] = [
  {
    num: '01',
    slug: '01-timing',
    title: '家を買うタイミングと流れ',
    question: '家を買うのは、いつ？ どれくらいかかる？',
    lead: '住みたい時期から逆算して動き出します。年齢・金利・制度の区切りも、タイミングを左右します。',
    step: 1,
  },
  {
    num: '02',
    slug: '02-types',
    title: '家の種類',
    question: '注文住宅・建売・マンション、何がちがう？',
    lead: 'いちばん大きなちがいは「自由に決められるか」と「完成品を見て買えるか」。払う額と払い方も変わります。',
    step: 1,
  },
  {
    num: '03',
    slug: '03-structure',
    title: '木造・鉄骨のちがい',
    question: '木造と鉄骨、良いところと気をつけるところは？',
    lead: '一戸建ての約9割は木造。地震への強さは構造の種類だけでは決まらず、建てた時期や耐震等級で大きく変わります。',
    step: 1,
  },
  {
    num: '04',
    slug: '04-builders',
    title: '住宅会社の選び方',
    question: 'どこに頼む？ 何を確かめる？',
    lead: '会社のタイプのちがいは優劣ではなく「誰が設計し、誰がつくり、誰が確かめるか」。最後は書類で確かめます。',
    step: 2,
  },
  {
    num: '05',
    slug: '05-money',
    title: 'お金の計画',
    question: 'いくら借りられて、いくらなら返せる？',
    lead: '銀行が貸してくれる額と、無理なく返せる額は別物です。金利と減税の事実も押さえます。',
    step: 2,
  },
  {
    num: '06',
    slug: '06-land',
    title: '土地選び',
    question: 'この土地に、どこまで建つ？',
    lead: '土地の値段より先に、用途地域と道路で「建てられる量」が決まります。広告の小さな表示に大事なことが書いてあります。',
    step: 3,
  },
  {
    num: '07',
    slug: '07-balance',
    title: '土地と建物のバランス',
    question: '土地に払った分、建物はどれだけ減る？',
    lead: '総予算が同じなら、土地と建物は1本の帯を取り合います。地域で大きく変わるのは、建物ではなく土地のほうでした。',
    step: 3,
  },
  {
    num: '08',
    slug: '08-performance',
    title: '住宅性能',
    question: '断熱・耐震の等級は、暮らしの何を変える？',
    lead: '暖かさ・省エネ・地震への強さは等級で比べられます。ただし気密は国の基準になく、測らないとわかりません。',
    step: 3,
  },
];

/** 公開済みの旧URL → 新しい章（ブックマーク対策） */
export const OLD_SLUGS: Record<string, string> = {
  '01-options': '02-types',
  '02-money': '05-money',
  '03-land': '06-land',
  '04-tradeoff': '07-balance',
  '05-structure': '03-structure',
  '06-performance': '08-performance',
  '07-builders': '04-builders',
};

export function chapterBySlug(slug: string): Chapter {
  const c = CHAPTERS.find((c) => c.slug === slug);
  if (!c) throw new Error(`unknown chapter: ${slug}`);
  return c;
}

export function neighbors(slug: string) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  return { prev: CHAPTERS[i - 1] ?? null, next: CHAPTERS[i + 1] ?? null };
}

export const UPDATED = '2026-09-29';
