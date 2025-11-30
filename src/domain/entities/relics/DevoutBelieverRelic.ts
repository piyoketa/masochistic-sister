import { Relic } from './Relic'

/**
 * 敬虔な信者
 */
export class DevoutBelieverRelic extends Relic {
  readonly id = 'devout-believer'
  readonly name = '敬虔な信者'
  readonly usageType = 'passive' as const
  readonly icon = '🙏'

  description(): string {
    return '「天の鎖」を使用しても消滅しなくなる'
  }
}
