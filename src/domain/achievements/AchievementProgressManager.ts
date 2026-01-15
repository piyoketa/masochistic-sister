/**
 * AchievementProgressManager
 * =========================
 * バトル中の実績進行度を集計する軽量マネージャ。
 * - 進行度は BattleConfig で初期値を注入し、Battle 内のイベントから通知を受けて増分を管理する。
 * - OperationRunner の巻き戻しに備えて、簡易な履歴スタックで undo を提供する。
 */
import { CorrosionState, StickyState } from '../entities/states'
import { CowardTrait } from '../entities/states/CowardTrait'
import type { Card } from '../entities/Card'
import type { Enemy } from '../entities/Enemy'
import { TentacleEnemy } from '../entities/enemies/TentacleEnemy'
import type { DamageEffectType, DamagePattern } from '../entities/Damages'
import { mapActionToCardId, type CardId } from '../library/Library'
import { createDefaultAchievementProgress, type AchievementProgress } from './types'

const KISS_EFFECT_TYPE: DamageEffectType = 'kiss'
const KISS_CARD_TITLE = '口づけ'
const MASOCHISTIC_AURA_TITLE = '被虐のオーラ'
const HEAVEN_CHAIN_CARD_ID: CardId = 'heaven-chain'

type HistoryEntry =
  | { type: 'corrosion'; prevValue: number }
  | { type: 'sticky'; prevValue: number }
  | { type: 'damage-taken'; prevValue: number }
  | { type: 'max-damage'; prevValue: number }
  | { type: 'max-multi-hit'; prevValue: number }
  | { type: 'heaven-chain-used'; prevValue: number }
  | { type: 'coward-flee'; prevValue: number }
  | { type: 'coward-defeat'; prevValue: number }
  | { type: 'tentacle-defeat'; prevValue: number }
  | { type: 'result-hp-low'; prevValue: number }
  | { type: 'kiss-received'; prevValue: number }
  | { type: 'kiss-used'; prevValue: number }
  | { type: 'aura-used'; prevValue: number }
  | { type: 'defeat'; prevValue: number }
  | { type: 'orc-hero-defeated'; prevValue: boolean }
  | { type: 'beam-cannon-defeated'; prevValue: boolean }

export class AchievementProgressManager {
  private progress: AchievementProgress
  private history: HistoryEntry[] = []

  constructor(initial?: AchievementProgress) {
    this.progress = initial ? { ...initial } : createDefaultAchievementProgress()
  }

  recordStateApplied(state: unknown): void {
    if (state instanceof CorrosionState) {
      const add = state.magnitude ?? 0
      if (add <= 0) {
        return
      }
      this.history.push({ type: 'corrosion', prevValue: this.progress.corrosionAccumulated })
      this.progress = { ...this.progress, corrosionAccumulated: this.progress.corrosionAccumulated + add }
      return
    }

    if (state instanceof StickyState) {
      const add = state.magnitude ?? 0
      if (add <= 0) {
        return
      }
      this.history.push({ type: 'sticky', prevValue: this.progress.stickyAccumulated })
      this.progress = { ...this.progress, stickyAccumulated: this.progress.stickyAccumulated + add }
    }
  }

  recordCardPlayed(card: Card): void {
    // 設計上の決定: 天の鎖はカードIDで厳密判定し、それ以外は表示名で判定する。
    const cardId = card.action ? mapActionToCardId(card.action) : null
    if (cardId === HEAVEN_CHAIN_CARD_ID) {
      this.history.push({ type: 'heaven-chain-used', prevValue: this.progress.heavenChainUsedCount })
      this.progress = { ...this.progress, heavenChainUsedCount: this.progress.heavenChainUsedCount + 1 }
    }
    if (card.definition.title === KISS_CARD_TITLE) {
      this.history.push({ type: 'kiss-used', prevValue: this.progress.kissUsedCount })
      this.progress = { ...this.progress, kissUsedCount: this.progress.kissUsedCount + 1 }
    }
    if (card.definition.title === MASOCHISTIC_AURA_TITLE) {
      this.history.push({ type: 'aura-used', prevValue: this.progress.masochisticAuraUsedCount })
      this.progress = { ...this.progress, masochisticAuraUsedCount: this.progress.masochisticAuraUsedCount + 1 }
    }
  }

  recordDamageTaken(params: {
    totalDamage: number
    damagePattern?: DamagePattern
    baseCount?: number
    effectType?: DamageEffectType
  }): void {
    const damage = Math.max(0, Math.floor(params.totalDamage))
    if (damage <= 0) {
      return
    }

    this.history.push({ type: 'damage-taken', prevValue: this.progress.damageTakenCount })
    this.progress = { ...this.progress, damageTakenCount: this.progress.damageTakenCount + 1 }

    if (damage > this.progress.maxDamageTaken) {
      this.history.push({ type: 'max-damage', prevValue: this.progress.maxDamageTaken })
      this.progress = { ...this.progress, maxDamageTaken: damage }
    }

    if (params.damagePattern === 'multi' && typeof params.baseCount === 'number') {
      // 連続攻撃かどうかは DamagePattern で判定し、hit数は baseCount を使う。
      const baseCount = Math.max(0, Math.floor(params.baseCount))
      if (baseCount > this.progress.maxMultiHitReceived) {
        this.history.push({ type: 'max-multi-hit', prevValue: this.progress.maxMultiHitReceived })
        this.progress = { ...this.progress, maxMultiHitReceived: baseCount }
      }
    }

    if (params.effectType === KISS_EFFECT_TYPE) {
      this.history.push({ type: 'kiss-received', prevValue: this.progress.kissReceivedCount })
      this.progress = { ...this.progress, kissReceivedCount: this.progress.kissReceivedCount + 1 }
    }
  }

  recordEnemyDefeated(enemy: Enemy): void {
    // 設計上の決定: 臆病判定は CowardTrait の有無で行い、敵の種類は TentacleEnemy で厳密判定する。
    const isCoward = enemy.getStates().some((state) => state instanceof CowardTrait)
    if (isCoward) {
      this.history.push({ type: 'coward-defeat', prevValue: this.progress.cowardDefeatCount })
      this.progress = { ...this.progress, cowardDefeatCount: this.progress.cowardDefeatCount + 1 }
    }
    if (enemy instanceof TentacleEnemy) {
      this.history.push({ type: 'tentacle-defeat', prevValue: this.progress.tentacleDefeatCount })
      this.progress = { ...this.progress, tentacleDefeatCount: this.progress.tentacleDefeatCount + 1 }
    }
  }

  recordEnemyFled(enemy: Enemy): void {
    const isCoward = enemy.getStates().some((state) => state instanceof CowardTrait)
    if (!isCoward) {
      return
    }
    this.history.push({ type: 'coward-flee', prevValue: this.progress.cowardFleeCount })
    this.progress = { ...this.progress, cowardFleeCount: this.progress.cowardFleeCount + 1 }
  }

  recordResultHpAtMost30(currentHp: number): void {
    const hp = Math.floor(currentHp)
    if (hp > 30) {
      return
    }
    this.history.push({ type: 'result-hp-low', prevValue: this.progress.resultHpAtMost30Count })
    this.progress = { ...this.progress, resultHpAtMost30Count: this.progress.resultHpAtMost30Count + 1 }
  }

  recordDefeat(): void {
    this.history.push({ type: 'defeat', prevValue: this.progress.defeatCount })
    this.progress = { ...this.progress, defeatCount: this.progress.defeatCount + 1 }
  }

  recordOrcHeroDefeated(): void {
    if (this.progress.orcHeroDefeated) {
      return
    }
    this.history.push({ type: 'orc-hero-defeated', prevValue: this.progress.orcHeroDefeated })
    this.progress = { ...this.progress, orcHeroDefeated: true }
  }

  recordBeamCannonDefeated(): void {
    if (this.progress.beamCannonDefeated) {
      return
    }
    this.history.push({ type: 'beam-cannon-defeated', prevValue: this.progress.beamCannonDefeated })
    this.progress = { ...this.progress, beamCannonDefeated: true }
  }

  /** OperationRunner の「一手戻す」相当で直前の進行度を復元する */
  undoLast(): void {
    const last = this.history.pop()
    if (!last) return
    if (last.type === 'corrosion') {
      this.progress = { ...this.progress, corrosionAccumulated: last.prevValue }
    } else if (last.type === 'sticky') {
      this.progress = { ...this.progress, stickyAccumulated: last.prevValue }
    } else if (last.type === 'damage-taken') {
      this.progress = { ...this.progress, damageTakenCount: last.prevValue }
    } else if (last.type === 'max-damage') {
      this.progress = { ...this.progress, maxDamageTaken: last.prevValue }
    } else if (last.type === 'max-multi-hit') {
      this.progress = { ...this.progress, maxMultiHitReceived: last.prevValue }
    } else if (last.type === 'heaven-chain-used') {
      this.progress = { ...this.progress, heavenChainUsedCount: last.prevValue }
    } else if (last.type === 'coward-flee') {
      this.progress = { ...this.progress, cowardFleeCount: last.prevValue }
    } else if (last.type === 'coward-defeat') {
      this.progress = { ...this.progress, cowardDefeatCount: last.prevValue }
    } else if (last.type === 'tentacle-defeat') {
      this.progress = { ...this.progress, tentacleDefeatCount: last.prevValue }
    } else if (last.type === 'result-hp-low') {
      this.progress = { ...this.progress, resultHpAtMost30Count: last.prevValue }
    } else if (last.type === 'kiss-received') {
      this.progress = { ...this.progress, kissReceivedCount: last.prevValue }
    } else if (last.type === 'kiss-used') {
      this.progress = { ...this.progress, kissUsedCount: last.prevValue }
    } else if (last.type === 'aura-used') {
      this.progress = { ...this.progress, masochisticAuraUsedCount: last.prevValue }
    } else if (last.type === 'defeat') {
      this.progress = { ...this.progress, defeatCount: last.prevValue }
    } else if (last.type === 'orc-hero-defeated') {
      this.progress = { ...this.progress, orcHeroDefeated: last.prevValue }
    } else if (last.type === 'beam-cannon-defeated') {
      this.progress = { ...this.progress, beamCannonDefeated: last.prevValue }
    }
  }

  /** 進行度のスナップショットを返す（Battle 終了時にストアへ反映する用途） */
  exportProgress(): AchievementProgress {
    return { ...this.progress }
  }
}
