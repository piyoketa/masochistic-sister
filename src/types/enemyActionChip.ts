import type { DamagePattern } from '@/domain/entities/Damages'
import type { CardId } from '@/domain/library/Library'

// 攻撃ダメージ表示用（カテゴリはDamagePattern由来。count>1などの判定は禁止）
export type EnemyActionDamageView = {
  patternType: DamagePattern | string
  icon: 'single' | 'multi'
  baseAmount: number
  amount: number
  amountChange?: 'up' | 'down'
  baseCount: number
  count: number
  countChange?: 'up' | 'down'
}

// 付与効果（CardEffectTag/状態異常/バフ・デバフ）表示用
export type EnemyActionEffectSegment =
  | {
      kind: 'card-effect-tag'
      label: string
      iconPath?: string
      tooltip: string
    }
  | {
      kind: 'state'
      label: string
      iconPath?: string
      tooltip: string
      stackable: boolean
      magnitude?: number
      target: 'self' | 'player' | 'ally'
      targetName?: string
    }

// 行動チップ1枚分のViewModel
export type EnemyActionChipViewModel = {
  key: string
  category: 'attack' | 'skill' | 'skip'
  title: string
  acted: boolean
  skipReason?: 'cannot-act' | 'no-action'
  targetName?: string
  hoverCardSource?: { cardId?: CardId; show: boolean }
  damage?: EnemyActionDamageView
  effects: EnemyActionEffectSegment[]
}
