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
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isActive(_context?: { battle?: import('@/domain/battle/Battle').Battle; player?: import('../Player').Player }): boolean {
    return false
  }

  /**
   * レリックが付与する追加の State 一覧を返す。デフォルトはなし。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAdditionalStates(_context?: { battle?: import('@/domain/battle/Battle').Battle; player?: import('../Player').Player }): import('../State').State[] {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPlayerTurnStart(_context: { battle: import('@/domain/battle/Battle').Battle; player: import('../Player').Player }): void {
    // デフォルトは何もしない
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveState(): unknown {
    return undefined
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  restoreState(_state: unknown): void {
    // デフォルト実装はステートレス
  }

  /**
   * コスト計算時の補正値を返す。デフォルトは0。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  costAdjustment(_context?: {
    battle?: import('@/domain/battle/Battle').Battle
    player?: import('../Player').Player
    cardTags?: import('../CardTag').CardTag[]
    cardType?: import('../CardDefinition').CardDefinition['cardType']
  }): number {
    return 0
  }
}
