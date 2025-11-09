export type RelicUsageType = 'active' | 'passive'

/**
 * レリックの基底クラス。
 * 今は名前と説明だけを返す最小構成。
 */
export abstract class Relic {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly usageType: RelicUsageType
  abstract readonly icon: string

  abstract description(): string
}
