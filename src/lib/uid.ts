// ページ内で一意な ID を振る（popover の紐づけ用）
export function uid(locals: { __uid?: number }, prefix: string): string {
  const next = (locals.__uid ?? 0) + 1;
  locals.__uid = next;
  return `${prefix}-${next}`;
}
