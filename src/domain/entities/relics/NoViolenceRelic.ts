import { Relic } from './Relic'

/**
 * 暴力を許さず：天の鎖コスト軽減
 */
export class NoViolenceRelic extends Relic {
  readonly id = 'no-violence'
  readonly name = '暴力を許さず'
  readonly usageType = 'passive' as const
  readonly icon = '⛓️'

  description(): string {
    return 'ターン中１回まで、「天の鎖」のマナコストを０にする'
  }
}
