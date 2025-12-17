/**
 * 攻撃ダメージ表示用の組み立てロジックをまとめたモジュール。
 * DamagePatternのtypeを唯一の攻撃カテゴリ根拠とし、count>1 などのヒューリスティックで単発/連撃を判定しない。
 */
import type { EnemyActionHint } from '@/types/battle'
import type { EnemyActionDamageView } from '@/types/enemyActionChip'

export function buildEnemyActionDamageView(hint: EnemyActionHint): EnemyActionDamageView | undefined {
  if (hint.type !== 'attack') {
    return undefined
  }
  const pattern = hint.pattern
  const calculatedPattern = hint.calculatedPattern ?? pattern

  const patternType = calculatedPattern?.type ?? pattern?.type ?? 'single'
  const icon: EnemyActionDamageView['icon'] = patternType === 'multi' ? 'multi' : 'single'

  const baseAmount = Math.max(0, Math.floor(pattern?.amount ?? 0))
  const baseCount = Math.max(1, Math.floor(pattern?.count ?? 1))
  const amount = Math.max(0, Math.floor(calculatedPattern?.amount ?? pattern?.amount ?? 0))
  const count = Math.max(1, Math.floor(calculatedPattern?.count ?? pattern?.count ?? 1))
  const diff = compareDamageToBase({ baseAmount, baseCount, amount, count, hasBase: Boolean(pattern) })

  return {
    patternType,
    icon,
    baseAmount,
    amount: diff.amount,
    amountChange: diff.amountChange,
    baseCount,
    count: diff.count,
    countChange: diff.countChange,
  }
}

export function compareDamageToBase(params: {
  baseAmount: number
  baseCount: number
  amount: number
  count: number
  hasBase?: boolean
}): {
  amount: number
  count: number
  amountChange?: 'up' | 'down'
  countChange?: 'up' | 'down'
} {
  const { baseAmount, baseCount, amount, count, hasBase } = params
  const amountChanged = hasBase && amount !== baseAmount
  const countChanged = hasBase && count !== baseCount
  return {
    amount,
    count,
    amountChange: amountChanged ? (amount > baseAmount ? 'up' : 'down') : undefined,
    countChange: countChanged ? (count > baseCount ? 'up' : 'down') : undefined,
  }
}
