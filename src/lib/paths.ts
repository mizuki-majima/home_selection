// base（GitHub Pages のサブパス）を考慮した内部リンクを作る
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}

export function chapterHref(slug: string): string {
  return withBase(`chapters/${slug}/`);
}
