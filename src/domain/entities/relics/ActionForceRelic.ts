import { Relic } from './Relic'

/**
 * 行動力：開始手札+1
 */
export class ActionForceRelic extends Relic {
  readonly id = 'action-force'
  readonly name = '行動力'
  readonly usageType = 'passive' as const
  readonly icon = '⚡'

  description(): string {
    return '永続：戦闘開始時の初期手札枚数が1枚増加する。'
  }
}
