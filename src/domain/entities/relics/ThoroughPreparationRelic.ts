import { Relic } from './Relic'

/**
 * 入念な準備：戦闘開始時の初期ドロー+2
 */
export class ThoroughPreparationRelic extends Relic {
  readonly id = 'thorough-preparation'
  readonly name = '入念な準備'
  readonly usageType = 'passive' as const
  readonly icon = '📝'

  description(): string {
    return '戦闘開始時の初期ドロー枚数+2'
  }
}
