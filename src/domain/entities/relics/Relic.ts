import type { RelicId } from './relicTypes'

export type RelicUsageType = 'active' | 'passive' | 'field'

export interface RelicDescriptionContext {
  battle?: import('@/domain/battle/Battle').Battle
  player?: import('../Player').Player
  /**
   * Battle インスタンスがないビュー層からでも最大HPなどを参照できるように、
   * 軽量なスナップショットも許容する。
   */
  playerSnapshot?: { maxHp: number }
}

/**
 * レリックの基底クラス。
 * 今は名前と説明だけを返す最小構成。
 */
export abstract class Relic {
  abstract readonly id: RelicId
  abstract readonly name: string
  abstract readonly usageType: RelicUsageType
  abstract readonly icon: string

  abstract description(context?: RelicDescriptionContext): string

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

  /**
   * レリックがポストヒット系の修正を行うかを返す。デフォルトは false。
   */
  isPostHitModifier(): boolean {
    return false
  }

  /**
   * ダメージヒット単位のフック。State と同様に、変化があれば true を返す。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onHitResolved(_context: import('../State').DamageHitContext): boolean {
    return false
  }

  /**
   * ダメージシーケンス終了時のフック。State と同様のタイミングで呼ばれる。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDamageSequenceResolved(_context: import('../State').DamageSequenceContext): void {
    // デフォルトは何もしない
  }
}
