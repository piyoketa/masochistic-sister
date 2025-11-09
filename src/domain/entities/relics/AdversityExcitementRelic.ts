import { Relic } from './Relic'

/**
 * 逆境への興奮：手札状態異常を分析し打点上昇
 */
export class AdversityExcitementRelic extends Relic {
  readonly id = 'adversity-excitement'
  readonly name = '逆境への興奮'
  readonly usageType = 'passive' as const
  readonly icon = '🔥'

  description(): string {
    return '永続：手札にある状態異常カードの枚数に応じて攻撃の打点が上昇する。'
  }
}
