// フィールド進行の順序と表示名を一元管理する。
// - 続きからの遷移先判定はこの順序に従うため、設計上の重要な意思決定としてここに固定する。
export const FIELD_ORDER = ['first-field', 'second-field'] as const

export type FieldId = (typeof FIELD_ORDER)[number]

export const FIELD_LABELS: Record<FieldId, string> = {
  'first-field': 'First Field',
  'second-field': 'Second Field',
}

const FIELD_PATHS: Record<FieldId, string> = {
  'first-field': '/field',
  'second-field': '/field/second',
}

export function resolveFieldPath(fieldId: FieldId): string {
  return FIELD_PATHS[fieldId]
}

export function isFieldId(value: string): value is FieldId {
  return FIELD_ORDER.includes(value as FieldId)
}

export function normalizeFieldIds(ids: string[]): FieldId[] {
  const trimmed = ids.map((id) => id.trim()).filter((id) => id.length > 0)
  const unique = Array.from(new Set(trimmed))
  return unique.filter(isFieldId)
}

export function findNextFieldId(clearedFieldIds: string[]): FieldId | null {
  const cleared = new Set(normalizeFieldIds(clearedFieldIds))
  // 進行順に並べた FIELD_ORDER から未クリアを探す。
  for (const fieldId of FIELD_ORDER) {
    if (!cleared.has(fieldId)) {
      return fieldId
    }
  }
  return null
}
