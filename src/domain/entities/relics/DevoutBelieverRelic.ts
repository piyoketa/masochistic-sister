import { Relic } from './Relic'

/**
 * 敬虔な信者：天の鎖が消費されない
 */
export class DevoutBelieverRelic extends Relic {
  readonly id = 'devout-believer'
  readonly name = '敬虔な信者'
  readonly usageType = 'passive' as const
  readonly icon = '🙏'

  description(): string {
    return '永続：「天の鎖」を使用しても消費されず、手札に戻る。'
  }
}
