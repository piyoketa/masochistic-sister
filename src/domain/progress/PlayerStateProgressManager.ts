/**
 * PlayerStateProgressManager の責務:
 * - 状態進行度（前半1〜6）と後半のダメージ表現を集計し、戦闘/報酬で発生するイベントから更新する。
 * - ダメージ表現の適用/解除と表情差分の算出を一元化し、ストアとスナップショットへ反映する。
 *
 * 責務ではないこと:
 * - UI描画やアニメーションの制御。
 * - イベント発火のタイミング判断（Battle/Reward 側が明示的に通知する）。
 *
 * 主な通信相手とインターフェース:
 * - Battle: recordDamageTaken / recordStateApplied / recordHeal / recordRewardHeal を呼び出して進行を通知する。
 * - PlayerStore: stateProgressCount / appliedDamageExpressions / totalDamageAmount / faceExpressionLevel を更新する。
 * - Battle: exportSnapshot / restoreFromSnapshot で状態を引き渡す。
 */
import { CorrosionState } from '../entities/states'

export const PLAYER_DAMAGE_EXPRESSION_IDS = [
  '脚の傷_小',
  '脚の傷_中',
  'お腹の傷_小',
  'お腹の傷_大',
  '胸1',
  '胸2',
  '胸3',
  '股1',
  '股2',
  '股3',
  '腕1',
  '腕2',
] as const

export const PLAYER_FACE_EXPRESSION_IDS = ['表情2', '表情3'] as const

export type PlayerDamageExpressionId = (typeof PLAYER_DAMAGE_EXPRESSION_IDS)[number]
export type PlayerDamageExpressionSource = 'corrosion' | 'damage'
export type FaceExpressionLevel = 0 | 2 | 3

export type PlayerDamageExpressionEntry = {
  id: PlayerDamageExpressionId
  damageValue: number
  source: PlayerDamageExpressionSource
}

export type PlayerStateProgressSnapshot = {
  stateProgressCount: number
  appliedDamageExpressions: PlayerDamageExpressionId[]
  faceExpressionLevel: FaceExpressionLevel
}

type PlayerStateProgressStoreLike = {
  stateProgressCount: number
  appliedDamageExpressions: PlayerDamageExpressionEntry[]
  totalDamageAmount: number
  faceExpressionLevel: FaceExpressionLevel
}

type DamageExpressionDefinition = {
  id: PlayerDamageExpressionId
  damageValue: number
  minDamage: number
  allowCorrosion: boolean
  requiresId?: PlayerDamageExpressionId
  order: number
}

const FRONT_PART_MIN = 1
const FRONT_PART_MAX = 6
const FRONT_PART_DAMAGE_THRESHOLD = 20
const FACE_EXPRESSION_LEVEL2_THRESHOLD = 50
const FACE_EXPRESSION_LEVEL3_THRESHOLD = 100

const DAMAGE_EXPRESSION_DEFINITIONS: DamageExpressionDefinition[] = [
  { id: '脚の傷_小', damageValue: 15, minDamage: 15, allowCorrosion: false, order: 0 },
  { id: '脚の傷_中', damageValue: 25, minDamage: 25, allowCorrosion: false, order: 1 },
  { id: 'お腹の傷_小', damageValue: 10, minDamage: 10, allowCorrosion: false, order: 2 },
  { id: 'お腹の傷_大', damageValue: 30, minDamage: 30, allowCorrosion: false, order: 3 },
  { id: '胸1', damageValue: 20, minDamage: 20, allowCorrosion: true, order: 4 },
  { id: '胸2', damageValue: 20, minDamage: 20, allowCorrosion: true, requiresId: '胸1', order: 5 },
  { id: '胸3', damageValue: 10, minDamage: 10, allowCorrosion: false, requiresId: '胸2', order: 6 },
  { id: '股1', damageValue: 20, minDamage: 20, allowCorrosion: true, order: 7 },
  { id: '股2', damageValue: 30, minDamage: 30, allowCorrosion: false, requiresId: '股1', order: 8 },
  { id: '股3', damageValue: 20, minDamage: 20, allowCorrosion: true, requiresId: '股2', order: 9 },
  { id: '腕1', damageValue: 40, minDamage: 40, allowCorrosion: false, order: 10 },
  { id: '腕2', damageValue: 50, minDamage: 50, allowCorrosion: false, requiresId: '腕1', order: 11 },
]

const DAMAGE_EXPRESSION_MAP = new Map<PlayerDamageExpressionId, DamageExpressionDefinition>(
  DAMAGE_EXPRESSION_DEFINITIONS.map((definition) => [definition.id, definition]),
)

export class PlayerStateProgressManager {
  private stateProgressCount: number
  private appliedDamageExpressionIds: PlayerDamageExpressionId[]
  private readonly store?: PlayerStateProgressStoreLike

  constructor(options?: {
    store?: PlayerStateProgressStoreLike
    initialState?: Partial<Pick<PlayerStateProgressSnapshot, 'stateProgressCount' | 'appliedDamageExpressions'>> & {
      appliedDamageExpressions?: PlayerDamageExpressionId[] | PlayerDamageExpressionEntry[]
    }
  }) {
    const source = options?.initialState ?? options?.store
    const initialCount = clampFrontPartCount(source?.stateProgressCount ?? FRONT_PART_MIN)
    const initialApplied = normalizeAppliedExpressionIds(source?.appliedDamageExpressions ?? [])
    // 設計上の決定: 前半パート中はダメージ表現を保持しない。
    this.stateProgressCount = initialCount
    this.appliedDamageExpressionIds = isFrontPart(initialCount) ? [] : initialApplied
    this.store = options?.store
    this.syncStore()
  }

  getCount(): number {
    return this.stateProgressCount
  }

  getAppliedDamageExpressionIds(): PlayerDamageExpressionId[] {
    return [...this.appliedDamageExpressionIds]
  }

  getFaceExpressionLevel(): FaceExpressionLevel {
    return resolveFaceExpressionLevel(this.getTotalDamageAmount())
  }

  exportSnapshot(): PlayerStateProgressSnapshot {
    return {
      stateProgressCount: this.stateProgressCount,
      appliedDamageExpressions: [...this.appliedDamageExpressionIds],
      faceExpressionLevel: this.getFaceExpressionLevel(),
    }
  }

  restoreFromSnapshot(snapshot: PlayerStateProgressSnapshot | null | undefined): void {
    const nextCount = clampFrontPartCount(snapshot?.stateProgressCount ?? FRONT_PART_MIN)
    const nextApplied = normalizeAppliedExpressionIds(snapshot?.appliedDamageExpressions ?? [])
    this.stateProgressCount = nextCount
    // 設計上の決定: 前半パートに戻る場合は、後半の表現を全て破棄する。
    this.appliedDamageExpressionIds = isFrontPart(nextCount) ? [] : nextApplied
    this.syncStore()
  }

  /**
   * ダメージイベントを通知する。
   * 前半パートは閾値到達で +1、後半パートはダメージ表現の適用判定のみ行う。
   */
  recordDamageTaken(totalDamage: number): void {
    const normalized = normalizeAmount(totalDamage)
    if (normalized <= 0) {
      return
    }
    if (isFrontPart(this.stateProgressCount)) {
      if (normalized >= FRONT_PART_DAMAGE_THRESHOLD) {
        this.stateProgressCount = clampFrontPartCount(this.stateProgressCount + 1)
        this.syncStore()
      }
      // 設計上の決定: 6到達の瞬間は前半処理のみ行い、後半表現は次イベントから適用する。
      return
    }
    this.applyDamageExpression({ damageAmount: normalized, hasCorrosion: false })
  }

  /**
   * 状態付与イベントを通知する。
   * 腐食のみ対象で、前半は +1、後半はダメージ表現の適用判定を行う。
   */
  recordStateApplied(state: unknown): void {
    if (!(state instanceof CorrosionState)) {
      return
    }
    const magnitude = normalizeAmount(state.magnitude ?? 0)
    if (magnitude <= 0) {
      return
    }
    if (isFrontPart(this.stateProgressCount)) {
      this.stateProgressCount = clampFrontPartCount(this.stateProgressCount + 1)
      this.syncStore()
      // 設計上の決定: 6到達の瞬間は前半処理のみ行い、後半表現は次イベントから適用する。
      return
    }
    this.applyDamageExpression({ damageAmount: 0, hasCorrosion: true })
  }

  /**
   * HP回復イベントを通知する（報酬以外）。
   * 後半パートではダメージ表現の解除判定を行い、前半パートでは何もしない。
   */
  recordHeal(amount: number): void {
    this.applyHeal(amount, { isReward: false })
  }

  /**
   * 報酬によるHP回復イベントを通知する。
   * 前半パートでは -1、後半パートではダメージ表現の解除判定を行う。
   */
  recordRewardHeal(amount: number): void {
    this.applyHeal(amount, { isReward: true })
  }

  private getTotalDamageAmount(): number {
    return calculateTotalDamage(this.appliedDamageExpressionIds)
  }

  private applyHeal(amount: number, options: { isReward: boolean }): void {
    const normalized = normalizeAmount(amount)
    if (normalized <= 0) {
      return
    }
    if (isFrontPart(this.stateProgressCount)) {
      if (!options.isReward) {
        return
      }
      this.stateProgressCount = clampFrontPartCount(this.stateProgressCount - 1)
      this.syncStore()
      return
    }

    const removed = removeDamageExpressionsByHeal({
      appliedIds: this.appliedDamageExpressionIds,
      healAmount: normalized,
    })
    if (removed.changed) {
      this.appliedDamageExpressionIds = removed.remaining
      this.syncStore()
    }
  }

  private applyDamageExpression(event: { damageAmount: number; hasCorrosion: boolean }): void {
    const candidate = pickNextExpression({
      damageAmount: event.damageAmount,
      hasCorrosion: event.hasCorrosion,
      appliedIds: this.appliedDamageExpressionIds,
    })
    if (!candidate) {
      return
    }
    this.appliedDamageExpressionIds = [...this.appliedDamageExpressionIds, candidate.id]
    this.syncStore()
  }

  private syncStore(): void {
    if (!this.store) {
      return
    }
    const entries = buildDamageExpressionEntries(this.appliedDamageExpressionIds)
    const totalDamageAmount = calculateTotalDamage(this.appliedDamageExpressionIds)
    const faceExpressionLevel = resolveFaceExpressionLevel(totalDamageAmount)
    this.store.stateProgressCount = this.stateProgressCount
    this.store.appliedDamageExpressions = entries
    this.store.totalDamageAmount = totalDamageAmount
    this.store.faceExpressionLevel = faceExpressionLevel
  }
}

function normalizeAppliedExpressionIds(
  values: PlayerDamageExpressionId[] | PlayerDamageExpressionEntry[] | undefined,
): PlayerDamageExpressionId[] {
  if (!values) {
    return []
  }
  const ids = Array.isArray(values)
    ? values.map((entry) => (typeof entry === 'string' ? entry : entry.id))
    : []
  const seen = new Set<PlayerDamageExpressionId>()
  const filtered: PlayerDamageExpressionId[] = []
  for (const id of ids) {
    if (!DAMAGE_EXPRESSION_MAP.has(id)) {
      continue
    }
    if (seen.has(id)) {
      continue
    }
    seen.add(id)
    filtered.push(id)
  }
  return filtered
}

function buildDamageExpressionEntries(ids: PlayerDamageExpressionId[]): PlayerDamageExpressionEntry[] {
  const entries: PlayerDamageExpressionEntry[] = []
  for (const id of ids) {
    const definition = DAMAGE_EXPRESSION_MAP.get(id)
    if (!definition) {
      continue
    }
    // 設計上の決定: 腐食条件を持つ表現は常に腐食由来として扱う。
    entries.push({
      id,
      damageValue: definition.damageValue,
      source: definition.allowCorrosion ? 'corrosion' : 'damage',
    })
  }
  return entries
}

function pickNextExpression(params: {
  damageAmount: number
  hasCorrosion: boolean
  appliedIds: PlayerDamageExpressionId[]
}): DamageExpressionDefinition | null {
  const appliedSet = new Set(params.appliedIds)
  const candidates = DAMAGE_EXPRESSION_DEFINITIONS.filter((definition) => {
    if (appliedSet.has(definition.id)) {
      return false
    }
    if (definition.requiresId && !appliedSet.has(definition.requiresId)) {
      return false
    }
    const meetsDamage = params.damageAmount >= definition.minDamage
    const meetsCorrosion = params.hasCorrosion && definition.allowCorrosion
    return meetsDamage || meetsCorrosion
  })
  if (candidates.length === 0) {
    return null
  }
  // 設計上の決定: 同値の場合は定義順で安定化させ、リプレイ時の揺れを防ぐ。
  candidates.sort((a, b) => b.damageValue - a.damageValue || a.order - b.order)
  return candidates[0] ?? null
}

function removeDamageExpressionsByHeal(params: {
  appliedIds: PlayerDamageExpressionId[]
  healAmount: number
}): { remaining: PlayerDamageExpressionId[]; changed: boolean } {
  let remainingHeal = params.healAmount
  const appliedSet = new Set(params.appliedIds)
  const removable = DAMAGE_EXPRESSION_DEFINITIONS.filter(
    (definition) => appliedSet.has(definition.id) && !definition.allowCorrosion,
  )
  // 設計上の決定: 回復量で解除できる最大値を優先し、残量で追加解除を試みる。
  removable.sort((a, b) => b.damageValue - a.damageValue || a.order - b.order)
  const toRemove = new Set<PlayerDamageExpressionId>()
  for (const definition of removable) {
    if (definition.damageValue <= remainingHeal) {
      toRemove.add(definition.id)
      remainingHeal -= definition.damageValue
    }
  }
  if (toRemove.size === 0) {
    return { remaining: params.appliedIds, changed: false }
  }
  return {
    remaining: params.appliedIds.filter((id) => !toRemove.has(id)),
    changed: true,
  }
}

function calculateTotalDamage(ids: PlayerDamageExpressionId[]): number {
  let total = 0
  for (const id of ids) {
    const definition = DAMAGE_EXPRESSION_MAP.get(id)
    if (!definition) {
      continue
    }
    total += definition.damageValue
  }
  return total
}

function resolveFaceExpressionLevel(totalDamage: number): FaceExpressionLevel {
  const normalized = normalizeAmount(totalDamage)
  if (normalized >= FACE_EXPRESSION_LEVEL3_THRESHOLD) {
    return 3
  }
  if (normalized >= FACE_EXPRESSION_LEVEL2_THRESHOLD) {
    return 2
  }
  return 0
}

function normalizeAmount(value: number): number {
  return Math.max(0, Math.floor(value))
}

function clampFrontPartCount(value: number): number {
  if (!Number.isFinite(value)) {
    return FRONT_PART_MIN
  }
  const rounded = Math.floor(value)
  return Math.min(FRONT_PART_MAX, Math.max(FRONT_PART_MIN, rounded))
}

function isFrontPart(progressCount: number): boolean {
  return progressCount < FRONT_PART_MAX
}
