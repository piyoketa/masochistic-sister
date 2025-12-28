/**
 * リッチテキスト表現を HTML へ変換するヘルパー。
 * - <variable> / <magnitude> を強調用の span に置き換える。
 * - HTML はエスケープして改行は <br> に変換する。
 */
export function renderRichText(
  text: string,
  options?: {
    variableClass?: string
    magnitudeClass?: string
  },
): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  const magnitudeClass = options?.magnitudeClass ?? 'text-magnitude'
  const variableClass = options?.variableClass ?? 'text-variable'

  return escaped
    .replace(/&lt;magnitude&gt;(.*?)&lt;\/magnitude&gt;/g, `<span class="${magnitudeClass}">$1</span>`)
    .replace(/&lt;variable&gt;(.*?)&lt;\/variable&gt;/g, `<span class="${variableClass}">$1</span>`)
}
