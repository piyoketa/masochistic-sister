// 進行セーブデータ(実績進行 + クリア済みフィールド)を localStorage に保存・読込するユーティリティ。
// - セーブデータは1スロット固定のため、キーは単一にする。
// - 読み込み時は必ずバリデーションし、壊れたデータは null 扱いにする。
import type { AchievementProgress } from '@/domain/achievements/types'
import { normalizeFieldIds } from '@/constants/fieldProgress'

const STORAGE_VERSION = 'v3'
const STORAGE_KEY = `ms-run-save/${STORAGE_VERSION}`

export type RunSaveData = {
  version: typeof STORAGE_VERSION
  savedAt: number
  achievementProgress: AchievementProgress
  clearedFieldIds: string[]
}

export function loadRunSaveData(): RunSaveData | null {
  if (!hasStorage()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = safeParse(raw)
    return validateRunSaveData(parsed)
  } catch {
    return null
  }
}

export function saveRunSaveData(payload: {
  achievementProgress: AchievementProgress
  clearedFieldIds: string[]
}): { success: boolean; message: string } {
  if (!hasStorage()) {
    return { success: false, message: 'ブラウザの保存領域にアクセスできません' }
  }
  const normalizedCleared = normalizeFieldIds(payload.clearedFieldIds)
  const safeProgress = cloneAchievementProgress(payload.achievementProgress)
  const data: RunSaveData = {
    version: STORAGE_VERSION,
    savedAt: Date.now(),
    achievementProgress: safeProgress,
    clearedFieldIds: normalizedCleared,
  }
  const validated = validateRunSaveData(data)
  if (!validated) {
    return { success: false, message: '保存データの検証に失敗しました' }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
    return { success: true, message: 'セーブデータを保存しました' }
  } catch {
    return { success: false, message: 'セーブデータの保存に失敗しました' }
  }
}

export function deleteRunSaveData(): void {
  if (!hasStorage()) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage が使えない場合は黙って無視する。
  }
}

function hasStorage(): boolean {
  try {
    const testKey = '__ms_run_save_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function validateRunSaveData(raw: unknown): RunSaveData | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Partial<RunSaveData>
  if (record.version !== STORAGE_VERSION) return null
  if (!isValidNumber(record.savedAt, 0)) return null
  const progress = validateAchievementProgress(record.achievementProgress)
  if (!progress) return null
  if (!Array.isArray(record.clearedFieldIds)) return null
  const clearedFieldIds = record.clearedFieldIds
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
  const normalized = normalizeFieldIds(clearedFieldIds)
  return {
    version: STORAGE_VERSION,
    savedAt: record.savedAt,
    achievementProgress: progress,
    clearedFieldIds: normalized,
  }
}

function validateAchievementProgress(raw: unknown): AchievementProgress | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Partial<AchievementProgress>
  if (!isValidNumber(record.corrosionAccumulated, 0)) return null
  if (!isValidNumber(record.stickyAccumulated, 0)) return null
  if (!isValidNumber(record.damageTakenCount, 0)) return null
  if (!isValidNumber(record.maxDamageTaken, 0)) return null
  if (!isValidNumber(record.maxMultiHitReceived, 0)) return null
  if (!isValidNumber(record.maxRelicOwnedCount, 0)) return null
  if (!isValidNumber(record.heavenChainUsedCount, 0)) return null
  if (!isValidNumber(record.cowardFleeCount, 0)) return null
  if (!isValidNumber(record.cowardDefeatCount, 0)) return null
  if (!isValidNumber(record.tentacleDefeatCount, 0)) return null
  if (!isValidNumber(record.resultHpAtMost30Count, 0)) return null
  if (!isValidNumber(record.kissReceivedCount, 0)) return null
  if (!isValidNumber(record.kissUsedCount, 0)) return null
  if (!isValidNumber(record.masochisticAuraUsedCount, 0)) return null
  if (!isValidNumber(record.defeatCount, 0)) return null
  if (typeof record.orcHeroDefeated !== 'boolean') return null
  if (typeof record.beamCannonDefeated !== 'boolean') return null
  const battleStartedCount = isValidNumber(record.battleStartedCount, 0) ? record.battleStartedCount : 0
  const maxStateProgressCount = isValidNumber(record.maxStateProgressCount, 1)
    ? record.maxStateProgressCount
    : 1
  const maxFaceExpressionLevel = isValidNumber(record.maxFaceExpressionLevel, 0)
    ? record.maxFaceExpressionLevel
    : 0
  const arm2ExpressionApplied =
    typeof record.arm2ExpressionApplied === 'boolean' ? record.arm2ExpressionApplied : false
  return {
    battleStartedCount,
    corrosionAccumulated: record.corrosionAccumulated,
    stickyAccumulated: record.stickyAccumulated,
    damageTakenCount: record.damageTakenCount,
    maxDamageTaken: record.maxDamageTaken,
    maxMultiHitReceived: record.maxMultiHitReceived,
    maxRelicOwnedCount: record.maxRelicOwnedCount,
    heavenChainUsedCount: record.heavenChainUsedCount,
    cowardFleeCount: record.cowardFleeCount,
    cowardDefeatCount: record.cowardDefeatCount,
    tentacleDefeatCount: record.tentacleDefeatCount,
    resultHpAtMost30Count: record.resultHpAtMost30Count,
    kissReceivedCount: record.kissReceivedCount,
    kissUsedCount: record.kissUsedCount,
    masochisticAuraUsedCount: record.masochisticAuraUsedCount,
    defeatCount: record.defeatCount,
    orcHeroDefeated: record.orcHeroDefeated,
    beamCannonDefeated: record.beamCannonDefeated,
    maxStateProgressCount,
    maxFaceExpressionLevel,
    arm2ExpressionApplied,
  }
}

function cloneAchievementProgress(progress: AchievementProgress): AchievementProgress {
  return {
    battleStartedCount: progress.battleStartedCount,
    corrosionAccumulated: progress.corrosionAccumulated,
    stickyAccumulated: progress.stickyAccumulated,
    damageTakenCount: progress.damageTakenCount,
    maxDamageTaken: progress.maxDamageTaken,
    maxMultiHitReceived: progress.maxMultiHitReceived,
    maxRelicOwnedCount: progress.maxRelicOwnedCount,
    heavenChainUsedCount: progress.heavenChainUsedCount,
    cowardFleeCount: progress.cowardFleeCount,
    cowardDefeatCount: progress.cowardDefeatCount,
    tentacleDefeatCount: progress.tentacleDefeatCount,
    resultHpAtMost30Count: progress.resultHpAtMost30Count,
    kissReceivedCount: progress.kissReceivedCount,
    kissUsedCount: progress.kissUsedCount,
    masochisticAuraUsedCount: progress.masochisticAuraUsedCount,
    defeatCount: progress.defeatCount,
    orcHeroDefeated: progress.orcHeroDefeated,
    beamCannonDefeated: progress.beamCannonDefeated,
    maxStateProgressCount: progress.maxStateProgressCount,
    maxFaceExpressionLevel: progress.maxFaceExpressionLevel,
    arm2ExpressionApplied: progress.arm2ExpressionApplied,
  }
}

function isValidNumber(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min
}
