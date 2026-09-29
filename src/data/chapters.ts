export interface Chapter {
  num: string;
  slug: string;
  title: string;
  /** 目次に出す1行の問い */
  question: string;
  lead: string;
}

export const CHAPTERS: Chapter[] = [
  {
    num: '01',
    slug: '01-options',
    title: '住まいの選択肢と流れ',
    question: '同じ「新築」でも、払う額と払い方はどう違う？',
    lead: '注文住宅・建売住宅・マンション。数字で並べると、違いは価格より「払い方」と「時間」に出ます。',
  },
  {
    num: '02',
    slug: '02-money',
    title: 'お金・資金計画',
    question: '借りられる額と、返せる額は同じ？',
    lead: '審査の上限は、家計から見た上限ではありません。金利と減税の事実を押さえて、自分の数字で確かめます。',
  },
  {
    num: '03',
    slug: '03-land',
    title: '土地選び',
    question: 'この土地に、どこまで建つ？',
    lead: '土地の値段より先に、用途地域と道路で「建てられる量」が決まります。広告の小さな表示に大事なことが書いてあります。',
  },
  {
    num: '04',
    slug: '04-tradeoff',
    title: '土地×建物のトレードオフ',
    question: '土地に払った分、建物はどれだけ減る？',
    lead: '総予算が同じなら、土地と建物は1本の帯を取り合います。地域で大きく変わるのは、建物ではなく土地のほうでした。',
  },
  {
    num: '05',
    slug: '05-structure',
    title: '木造・鉄骨',
    question: '骨組みの違いは、何の違い？',
    lead: '持家一戸建ての約9割は木造。地震で被害を分けたのは、構造の種類より、建てた時期と壁・接合部・耐震等級でした。',
  },
  {
    num: '06',
    slug: '06-performance',
    title: '住宅性能',
    question: '等級の数字は、暮らしの何を変える？',
    lead: '断熱・省エネ・耐震は等級で比べられます。ただし気密は国の基準になく、測らないとわかりません。',
  },
  {
    num: '07',
    slug: '07-builders',
    title: '住宅会社の選び方',
    question: '依頼先のタイプで、何が変わる？',
    lead: '違いは優劣ではなく、誰が設計・施工・工事監理をするかと、標準の範囲。最後は書類で確かめます。',
  },
];

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
