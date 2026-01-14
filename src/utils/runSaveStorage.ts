// 進行セーブデータ(実績進行 + クリア済みフィールド)を localStorage に保存・読込するユーティリティ。
// - セーブデータは1スロット固定のため、キーは単一にする。
// - 読み込み時は必ずバリデーションし、壊れたデータは null 扱いにする。
import type { AchievementProgress } from '@/domain/achievements/types'
import { normalizeFieldIds } from '@/constants/fieldProgress'

const STORAGE_VERSION = 'v1'
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
  if (!isValidNumber(record.statusCardMemories, 0)) return null
  if (!isValidNumber(record.corrosionAccumulated, 0)) return null
  if (!isValidNumber(record.statusCardUsed, 0)) return null
  if (!isValidNumber(record.memoryCardUsed, 0)) return null
  if (!isValidNumber(record.multiAttackAcquired, 0)) return null
  if (!Array.isArray(record.cowardDefeatedIds) || !record.cowardDefeatedIds.every((id) => isValidNumber(id, 0))) {
    return null
  }
  if (typeof record.orcHeroDefeated !== 'boolean') return null
  return {
    statusCardMemories: record.statusCardMemories,
    corrosionAccumulated: record.corrosionAccumulated,
    statusCardUsed: record.statusCardUsed,
    memoryCardUsed: record.memoryCardUsed,
    multiAttackAcquired: record.multiAttackAcquired,
    cowardDefeatedIds: [...record.cowardDefeatedIds],
    orcHeroDefeated: record.orcHeroDefeated,
  }
}

function cloneAchievementProgress(progress: AchievementProgress): AchievementProgress {
  return {
    statusCardMemories: progress.statusCardMemories,
    corrosionAccumulated: progress.corrosionAccumulated,
    statusCardUsed: progress.statusCardUsed,
    memoryCardUsed: progress.memoryCardUsed,
    multiAttackAcquired: progress.multiAttackAcquired,
    cowardDefeatedIds: [...progress.cowardDefeatedIds],
    orcHeroDefeated: progress.orcHeroDefeated,
  }
}

function isValidNumber(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min
}
