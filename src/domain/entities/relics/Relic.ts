export type RelicUsageType = 'active' | 'passive'

/**
 * レリックの基底クラス。
 * 今は名前と説明だけを返す最小構成。
 */
export abstract class Relic {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly usageType: RelicUsageType
  abstract readonly icon: string

  abstract description(): string

  /**
   * レリックが現在有効かどうかを判定する。
   * 当面は Battle 側の Snapshot 生成時に呼ばれ、View は結果のみを受け取る。
   * デフォルト実装は常に true（モック）。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isActive(_context?: { battle?: import('@/domain/battle/Battle').Battle; player?: import('../Player').Player }): boolean {
    return true
  }
}
