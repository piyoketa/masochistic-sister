import { Relic } from './Relic'

/**
 * 滑りやすさ：ねばねばがあると攻撃回数アップ
 */
export class SlipperyTouchRelic extends Relic {
  readonly id = 'slippery-touch'
  readonly name = '滑りやすさ'
  readonly usageType = 'passive' as const
  readonly icon = '💦'

  description(): string {
    return '永続：手札に「ねばねば」がある間、攻撃カードの攻撃回数が+1される。'
  }
}
