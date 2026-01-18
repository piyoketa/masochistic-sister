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
import type { FaceExpressionLevel, PlayerDamageExpressionId } from '../progress/PlayerStateProgressManager'
import { createDefaultAchievementProgress, type AchievementProgress } from './types'

const KISS_EFFECT_TYPE: DamageEffectType = 'kiss'
const KISS_CARD_TITLE = '口づけ'
const MASOCHISTIC_AURA_TITLE = '被虐のオーラ'
const HEAVEN_CHAIN_CARD_ID: CardId = 'heaven-chain'

export type PlayerSpeechReason =
  | 'achievement-battle-started'
  | 'achievement-corrosion-first'
  | 'achievement-sticky-first'
  | 'achievement-kiss-received-first'
  | 'achievement-kiss-used-first'
  | 'achievement-aura-first'
  | 'achievement-aura-5'
  | 'achievement-state-progress-3'
  | 'achievement-state-progress-4'
  | 'achievement-state-progress-5'
  | 'achievement-state-progress-6'
  | 'achievement-face-2'
  | 'achievement-face-3'
  | 'achievement-arm2'

export type PlayerSpeechEntry = {
  id: number
  text: string
  reason: PlayerSpeechReason
  priority: number
}

type PlayerSpeechDefinition = {
  text: string
  priority: number
}

const PLAYER_SPEECH_DEFINITIONS: Record<PlayerSpeechReason, PlayerSpeechDefinition> = {
  'achievement-battle-started': { text: '私が戦わないと...', priority: 1 },
  'achievement-corrosion-first': { text: '修道服...\n大切にしてたのに...', priority: 1 },
  'achievement-sticky-first': { text: 'ネバネバして\n動きづらい...', priority: 1 },
  'achievement-kiss-received-first': { text: 'キス...\nはじめてだったのに...', priority: 1 },
  'achievement-kiss-used-first': { text: '化け物に...\n自分からするなんて...', priority: 1 },
  'achievement-aura-first': { text: 'これで戦える...', priority: 1 },
  'achievement-aura-5': { text: 'もっと傷を受けなきゃ...', priority: 1 },
  'achievement-state-progress-3': { text: '早く倒さないと...', priority: 107 },
  'achievement-state-progress-4': { text: 'もうボロボロ...', priority: 108 },
  'achievement-state-progress-5': { text: '痛い...\nこれ以上は...', priority: 109 },
  'achievement-state-progress-6': { text: 'もう...\n右腕が上がらない...', priority: 110 },
  'achievement-face-2': { text: 'あはは...意識が...', priority: 111 },
  'achievement-face-3': { text: 'これだけ喰らえば...\n無敵ですよねぇ...？', priority: 112 },
  'achievement-arm2': { text: 'あは...腕が...', priority: 113 },
}

const STATE_PROGRESS_SPEECH_BY_LEVEL: Partial<Record<number, PlayerSpeechReason>> = {
  3: 'achievement-state-progress-3',
  4: 'achievement-state-progress-4',
  5: 'achievement-state-progress-5',
  6: 'achievement-state-progress-6',
}

const FACE_EXPRESSION_SPEECH_BY_LEVEL: Partial<Record<number, PlayerSpeechReason>> = {
  2: 'achievement-face-2',
  3: 'achievement-face-3',
}

type HistoryEntry =
  | { type: 'battle-started'; prevValue: number }
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
  | { type: 'max-state-progress'; prevValue: number }
  | { type: 'max-face-expression'; prevValue: number }
  | { type: 'arm2-expression'; prevValue: boolean }
  | { type: 'speech-queued'; prevEntry: PlayerSpeechEntry | null }

export class AchievementProgressManager {
  private progress: AchievementProgress
  private history: HistoryEntry[] = []
  private speechQueue: PlayerSpeechEntry | null = null

  constructor(initial?: AchievementProgress) {
    this.progress = initial ? { ...initial } : createDefaultAchievementProgress()
  }

  recordBattleStarted(): void {
    const nextCount = this.progress.battleStartedCount + 1
    this.history.push({ type: 'battle-started', prevValue: this.progress.battleStartedCount })
    this.progress = { ...this.progress, battleStartedCount: nextCount }
    if (nextCount === 1) {
      // 初戦の開始時のみ、固定セリフを発話キューへ積む。
      // this.enqueueSpeechByReason('achievement-battle-started')
    }
  }

  recordStateApplied(state: unknown): void {
    if (state instanceof CorrosionState) {
      const add = state.magnitude ?? 0
      if (add <= 0) {
        return
      }
      const prev = this.progress.corrosionAccumulated
      const next = prev + add
      this.history.push({ type: 'corrosion', prevValue: prev })
      this.progress = { ...this.progress, corrosionAccumulated: next }
      if (prev < 1 && next >= 1) {
        // 腐食を初めて受けたタイミングだけを拾う。
        this.enqueueSpeechByReason('achievement-corrosion-first')
      }
      return
    }

    if (state instanceof StickyState) {
      const add = state.magnitude ?? 0
      if (add <= 0) {
        return
      }
      const prev = this.progress.stickyAccumulated
      const next = prev + add
      this.history.push({ type: 'sticky', prevValue: prev })
      this.progress = { ...this.progress, stickyAccumulated: next }
      if (prev < 1 && next >= 1) {
        // 粘液も初回のみ発話対象にする。
        this.enqueueSpeechByReason('achievement-sticky-first')
      }
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
      const next = this.progress.kissUsedCount + 1
      this.history.push({ type: 'kiss-used', prevValue: this.progress.kissUsedCount })
      this.progress = { ...this.progress, kissUsedCount: next }
      if (next === 1) {
        this.enqueueSpeechByReason('achievement-kiss-used-first')
      }
    }
    if (card.definition.title === MASOCHISTIC_AURA_TITLE) {
      const next = this.progress.masochisticAuraUsedCount + 1
      this.history.push({ type: 'aura-used', prevValue: this.progress.masochisticAuraUsedCount })
      this.progress = { ...this.progress, masochisticAuraUsedCount: next }
      if (next === 1) {
        this.enqueueSpeechByReason('achievement-aura-first')
      } else if (next === 5) {
        this.enqueueSpeechByReason('achievement-aura-5')
      }
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
      const next = this.progress.kissReceivedCount + 1
      this.history.push({ type: 'kiss-received', prevValue: this.progress.kissReceivedCount })
      this.progress = { ...this.progress, kissReceivedCount: next }
      if (next === 1) {
        this.enqueueSpeechByReason('achievement-kiss-received-first')
      }
    }
  }

  recordStateProgressCount(count: number): void {
    if (!Number.isFinite(count)) {
      return
    }
    const normalized = Math.max(1, Math.floor(count))
    if (normalized <= this.progress.maxStateProgressCount) {
      return
    }
    const prev = this.progress.maxStateProgressCount
    this.history.push({ type: 'max-state-progress', prevValue: prev })
    this.progress = { ...this.progress, maxStateProgressCount: normalized }
    // 設計判断: 状態進行の到達は「最大値更新」に合わせて一度だけ喋る。
    for (let level = prev + 1; level <= normalized; level += 1) {
      const reason = STATE_PROGRESS_SPEECH_BY_LEVEL[level]
      if (reason) {
        this.enqueueSpeechByReason(reason)
      }
    }
  }

  recordFaceExpressionLevel(level: FaceExpressionLevel): void {
    const normalized = level === 2 || level === 3 ? level : 0
    if (normalized <= this.progress.maxFaceExpressionLevel) {
      return
    }
    const prev = this.progress.maxFaceExpressionLevel
    this.history.push({ type: 'max-face-expression', prevValue: prev })
    this.progress = { ...this.progress, maxFaceExpressionLevel: normalized }
    for (let candidate = prev + 1; candidate <= normalized; candidate += 1) {
      const reason = FACE_EXPRESSION_SPEECH_BY_LEVEL[candidate]
      if (reason) {
        this.enqueueSpeechByReason(reason)
      }
    }
  }

  recordDamageExpressionApplied(expressionId: PlayerDamageExpressionId): void {
    if (expressionId !== '腕2' || this.progress.arm2ExpressionApplied) {
      return
    }
    this.history.push({ type: 'arm2-expression', prevValue: this.progress.arm2ExpressionApplied })
    this.progress = { ...this.progress, arm2ExpressionApplied: true }
    this.enqueueSpeechByReason('achievement-arm2')
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
    if (last.type === 'battle-started') {
      this.progress = { ...this.progress, battleStartedCount: last.prevValue }
    } else if (last.type === 'corrosion') {
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
    } else if (last.type === 'max-state-progress') {
      this.progress = { ...this.progress, maxStateProgressCount: last.prevValue }
    } else if (last.type === 'max-face-expression') {
      this.progress = { ...this.progress, maxFaceExpressionLevel: last.prevValue }
    } else if (last.type === 'arm2-expression') {
      this.progress = { ...this.progress, arm2ExpressionApplied: last.prevValue }
    } else if (last.type === 'speech-queued') {
      this.speechQueue = last.prevEntry ? { ...last.prevEntry } : null
    }
  }

  /** 進行度のスナップショットを返す（Battle 終了時にストアへ反映する用途） */
  exportProgress(): AchievementProgress {
    return { ...this.progress }
  }

  /**
   * 表示待ちの発話キューを取り出し、キューを空にする。
   * View 側の「次の操作開始時」トリガーで呼び出すことを想定している。
   */
  consumePlayerSpeechQueue(): PlayerSpeechEntry[] {
    const queued = this.speechQueue ? [{ ...this.speechQueue }] : []
    this.speechQueue = null
    return queued
  }

  private enqueueSpeechByReason(reason: PlayerSpeechReason): void {
    const definition = PLAYER_SPEECH_DEFINITIONS[reason]
    if (!definition) {
      return
    }
    this.enqueueSpeech(definition.text, reason, definition.priority)
  }

  private enqueueSpeech(text: string, reason: PlayerSpeechReason, priority: number): void {
    const normalizedPriority = Math.floor(priority)
    const entry: PlayerSpeechEntry = {
      id: Date.now() + Math.random(),
      text,
      reason,
      priority: normalizedPriority,
    }
    const current = this.speechQueue
    if (!current) {
      this.history.push({ type: 'speech-queued', prevEntry: null })
      this.speechQueue = entry
      return
    }
    // 設計判断: 発話は常に1件のみ保持し、優先度が高い場合だけ差し替える。
    if (normalizedPriority <= current.priority) {
      return
    }
    this.history.push({ type: 'speech-queued', prevEntry: { ...current } })
    this.speechQueue = entry
  }
}
