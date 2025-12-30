/**
 * AchievementProgressManager
 * =========================
 * バトル中の実績進行度を集計する軽量マネージャ。
 * - 進行度は BattleConfig で初期値を注入し、Battle 内のイベントから通知を受けて増分を管理する。
 * - OperationRunner の巻き戻しに備えて、簡易な履歴スタックで undo を提供する。
 * - 現時点では「状態異常カード累計8枚獲得」のカウントだけを扱い、他条件は後続対応とする。
 */
import { Attack } from '../entities/Action'
import { CorrosionState } from '../entities/states'
import { MemoryCardTag } from '../entities/cardTags/MemoryCardTag'
import { Damages } from '../entities/Damages'
import type { Card } from '../entities/Card'
import type { Enemy } from '../entities/Enemy'
import { createDefaultAchievementProgress, type AchievementProgress } from './types'

const MEMORY_TAG_ID = new MemoryCardTag().id

type HistoryEntry =
  | { type: 'status-card-memory'; prevValue: number }
  | { type: 'corrosion'; prevValue: number }
  | { type: 'status-card-used'; prevValue: number }
  | { type: 'memory-card-used'; prevValue: number }
  | { type: 'multi-attack-generated'; prevValue: number }
  | { type: 'coward-defeated'; enemyId: number }
  | { type: 'orc-hero-defeated'; prevValue: boolean }

export class AchievementProgressManager {
  private progress: AchievementProgress
  private history: HistoryEntry[] = []

  constructor(initial?: AchievementProgress) {
    this.progress = initial
      ? { ...initial, cowardDefeatedIds: [...initial.cowardDefeatedIds] }
      : createDefaultAchievementProgress()
  }

  /** rememberState で状態異常カードを生成した際に呼び出し、進行度を1増やす */
  recordStatusCardMemory(): void {
    this.history.push({ type: 'status-card-memory', prevValue: this.progress.statusCardMemories })
    this.progress = {
      ...this.progress,
      statusCardMemories: this.progress.statusCardMemories + 1,
    }
  }

  recordStateApplied(state: unknown): void {
    if (!(state instanceof CorrosionState)) {
      return
    }
    const add = state.magnitude ?? 0
    if (add <= 0) {
      return
    }
    this.history.push({ type: 'corrosion', prevValue: this.progress.corrosionAccumulated })
    this.progress = { ...this.progress, corrosionAccumulated: this.progress.corrosionAccumulated + add }
  }

  recordCardPlayed(card: Card): void {
    const def = card.definition
    if (def.cardType === 'status') {
      this.history.push({ type: 'status-card-used', prevValue: this.progress.statusCardUsed })
      this.progress = { ...this.progress, statusCardUsed: this.progress.statusCardUsed + 1 }
    }
    const hasMemoryTag =
      def.cardType === 'attack' &&
      (def.categoryTags ?? []).some((tag) => tag.id === MEMORY_TAG_ID)
    if (hasMemoryTag) {
      this.history.push({ type: 'memory-card-used', prevValue: this.progress.memoryCardUsed })
      this.progress = { ...this.progress, memoryCardUsed: this.progress.memoryCardUsed + 1 }
    }
  }

  recordMultiAttackGenerated(card: Card): void {
    const action = card.action
    if (!(action instanceof Attack)) {
      return
    }
    const damages: Damages | undefined = action.baseDamages
    if (!damages || damages.type !== 'multi') {
      return
    }
    if (damages.baseCount < 5) {
      return
    }
    this.history.push({ type: 'multi-attack-generated', prevValue: this.progress.multiAttackAcquired })
    this.progress = { ...this.progress, multiAttackAcquired: this.progress.multiAttackAcquired + 1 }
  }

  recordCowardDefeated(enemy: Enemy | null | undefined): void {
    if (!enemy || enemy.id === undefined) {
      return
    }
    const enemyId = enemy.id
    if (this.progress.cowardDefeatedIds.includes(enemyId)) {
      return
    }
    this.history.push({ type: 'coward-defeated', enemyId })
    this.progress = {
      ...this.progress,
      cowardDefeatedIds: [...this.progress.cowardDefeatedIds, enemyId],
    }
  }

  recordOrcHeroDefeated(): void {
    if (this.progress.orcHeroDefeated) {
      return
    }
    this.history.push({ type: 'orc-hero-defeated', prevValue: this.progress.orcHeroDefeated })
    this.progress = { ...this.progress, orcHeroDefeated: true }
  }

  /** OperationRunner の「一手戻す」相当で直前の進行度を復元する */
  undoLast(): void {
    const last = this.history.pop()
    if (!last) return
    if (last.type === 'status-card-memory') {
      this.progress = { ...this.progress, statusCardMemories: last.prevValue }
    } else if (last.type === 'corrosion') {
      this.progress = { ...this.progress, corrosionAccumulated: last.prevValue }
    } else if (last.type === 'status-card-used') {
      this.progress = { ...this.progress, statusCardUsed: last.prevValue }
    } else if (last.type === 'memory-card-used') {
      this.progress = { ...this.progress, memoryCardUsed: last.prevValue }
    } else if (last.type === 'multi-attack-generated') {
      this.progress = { ...this.progress, multiAttackAcquired: last.prevValue }
    } else if (last.type === 'coward-defeated') {
      this.progress = {
        ...this.progress,
        cowardDefeatedIds: this.progress.cowardDefeatedIds.filter((id) => id !== last.enemyId),
      }
    } else if (last.type === 'orc-hero-defeated') {
      this.progress = { ...this.progress, orcHeroDefeated: last.prevValue }
    }
  }

  /** 進行度のスナップショットを返す（Battle 終了時にストアへ反映する用途） */
  exportProgress(): AchievementProgress {
    return { ...this.progress, cowardDefeatedIds: [...this.progress.cowardDefeatedIds] }
  }
}
