/**
 * 敵名にレベル表記を付与するヘルパー。
 * レベル未指定または1以下の場合は元の名前を返す。
 */
export function formatEnemyNameWithLevel(name: string, level?: number): string {
  if (!level || level <= 1) {
    return name
  }
  return `${name} Lv${level}`
}
