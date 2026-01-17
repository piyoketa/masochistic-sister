// プレイヤーのセーブデータを localStorage に保存・読込するためのユーティリティ
// - スロットは最大5件に制限し、最古のものから自動削除する
// - バリデーションで壊れたデータを除外し、UI側でメッセージ表示できるようにする
import type { CardBlueprint } from '@/domain/library/Library'

const SAVE_VERSION = 'v2'
const STORAGE_PREFIX = `ms-save/${SAVE_VERSION}/`
const SLOT_LIMIT = 5

export interface PlayerSaveData {
  version: typeof SAVE_VERSION
  savedAt: number
  hp: number
  maxHp: number
  gold: number
  deck: CardBlueprint[]
  relics: string[]
  relicLimit: number
  stateProgressCount: number
}

export interface SaveSlotSummary {
  slotId: string
  savedAt: number
}

export function listSlots(): SaveSlotSummary[] {
  const entries: SaveSlotSummary[] = []
  if (!hasStorage()) {
    return entries
  }
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(STORAGE_PREFIX)) {
      continue
    }
    const slotId = key.slice(STORAGE_PREFIX.length)
    const raw = localStorage.getItem(key)
    if (!raw) continue
    const data = safeParse(raw)
    const validated = validateSaveData(data)
    if (!validated) continue
    entries.push({ slotId, savedAt: validated.savedAt })
  }
  // 新しい順に並べて返す
  return entries.sort((a, b) => b.savedAt - a.savedAt)
}

export function saveSlot(slotId: string, snapshot: PlayerSaveData): { success: boolean; message: string } {
  const normalizedId = normalizeSlotId(slotId)
  if (!normalizedId) {
    return { success: false, message: 'スロット名を入力してください' }
  }
  if (!hasStorage()) {
    return { success: false, message: 'ブラウザの保存領域にアクセスできません' }
  }
  const payload: PlayerSaveData = {
    ...snapshot,
    version: SAVE_VERSION,
    savedAt: Date.now(),
  }
  const validated = validateSaveData(payload)
  if (!validated) {
    return { success: false, message: '保存データの検証に失敗しました' }
  }
  try {
    localStorage.setItem(buildKey(normalizedId), JSON.stringify(validated))
    pruneOldSlots()
    return { success: true, message: '保存しました' }
  } catch (error) {
    console.error('saveSlot failed', error)
    return { success: false, message: '保存に失敗しました' }
  }
}

export function loadSlot(slotId: string): PlayerSaveData | null {
  const normalizedId = normalizeSlotId(slotId)
  if (!normalizedId || !hasStorage()) {
    return null
  }
  try {
    const raw = localStorage.getItem(buildKey(normalizedId))
    if (!raw) {
      return null
    }
    const parsed = safeParse(raw)
    const validated = validateSaveData(parsed)
    return validated
  } catch (error) {
    console.error('loadSlot failed', error)
    return null
  }
}

export function deleteSlot(slotId: string): void {
  const normalizedId = normalizeSlotId(slotId)
  if (!normalizedId || !hasStorage()) {
    return
  }
  try {
    localStorage.removeItem(buildKey(normalizedId))
  } catch (error) {
    console.error('deleteSlot failed', error)
  }
}

function pruneOldSlots(): void {
  const slots = listSlots()
  if (slots.length <= SLOT_LIMIT) {
    return
  }
  const toDelete = slots.slice(SLOT_LIMIT)
  for (const slot of toDelete) {
    deleteSlot(slot.slotId)
  }
}

function buildKey(slotId: string): string {
  return `${STORAGE_PREFIX}${slotId}`
}

function normalizeSlotId(slotId: string): string {
  return slotId.trim()
}

function hasStorage(): boolean {
  try {
    const testKey = '__ms_save_test__'
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

function validateSaveData(data: unknown): PlayerSaveData | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Partial<PlayerSaveData>
  if (record.version !== SAVE_VERSION) return null
  if (!isValidNumber(record.savedAt, 0)) return null
  if (!isValidNumber(record.hp, 0)) return null
  if (!isValidNumber(record.maxHp, 1)) return null
  if (!isValidNumber(record.gold, 0)) return null
  if (!Array.isArray(record.deck) || !record.deck.every(isValidBlueprint)) return null
  if (!Array.isArray(record.relics) || !record.relics.every((v) => typeof v === 'string')) return null
  if (!isValidNumber(record.relicLimit, 1)) return null
  const stateProgressCount = normalizeStateProgressCount(record.stateProgressCount)
  const relicLimit = record.relicLimit
  return {
    version: SAVE_VERSION,
    savedAt: record.savedAt,
    hp: record.hp,
    maxHp: record.maxHp,
    gold: record.gold,
    deck: record.deck.map((b) => ({ ...b })),
    relics: [...record.relics],
    relicLimit,
    stateProgressCount,
  }
}

function isValidNumber(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min
}

function isValidBlueprint(value: unknown): value is CardBlueprint {
  if (!value || typeof value !== 'object') return false
  const v = value as CardBlueprint
  if (typeof v.type !== 'string' || v.type.length === 0) return false
  if (v.overrideAmount !== undefined && !isValidNumber(v.overrideAmount, 0)) return false
  if (v.overrideCount !== undefined && !isValidNumber(v.overrideCount, 1)) return false
  return true
}

function normalizeStateProgressCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1
  }
  const rounded = Math.floor(value)
  return Math.min(10, Math.max(1, rounded))
}
