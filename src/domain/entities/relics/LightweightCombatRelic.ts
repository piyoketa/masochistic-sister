import { Relic } from './Relic'

/**
 * 軽装戦闘：手札に腐食があると攻撃回数アップ
 */
export class LightweightCombatRelic extends Relic {
  readonly id = 'lightweight-combat'
  readonly name = '軽装戦闘'
  readonly usageType = 'passive' as const
  readonly icon = '🪶'

  description(): string {
    return '永続：手札に「腐食」がある間、攻撃カードの攻撃回数が+1される。'
  }
}
