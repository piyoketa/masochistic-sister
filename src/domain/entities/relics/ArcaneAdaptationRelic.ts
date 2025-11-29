import { Relic } from './Relic'

/**
 * 魔への順応：被虐のオーラのコストを削減
 */
export class ArcaneAdaptationRelic extends Relic {
  readonly id = 'arcane-adaptation'
  readonly name = '魔への順応'
  readonly usageType = 'passive' as const
  readonly icon = '👿'

  description(): string {
    return 'ターン中１回まで、「被虐のオーラ」のマナコストを０にする'
  }
}
