/*
StateAction.ts の責務:
- BadState（手札に入る状態異常）専用の Action 実装を提供し、コスト計算やカード定義生成を統一する。
- 酩酊(Intoxication) や PureBodyRelic 等によるコスト補正をここに集約し、各 State 実装から切り離す。

非責務:
- バトル結果の記録や状態異常の生成は扱わない（ActionBase / State が担当）。

インターフェース:
- props.cardDefinition / gainStates は State 側で定義されたものを使用する。
- cost(context) でコスト補正を行う。現時点では「酩酊」によるコスト増のみ。
*/
import { Action, type ActionContext, type ActionCostContext, type ActionType } from './ActionBase'
import type { CardTag } from '../CardTag'
import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'
import type { CardDefinition } from '../CardDefinition'
import type { State } from '../State'
import { PureBodyRelic } from '../relics/PureBodyRelic'

interface StateActionProps {
  name: string
  cardDefinition: CardDefinition
  gainStates?: Array<() => State>
  tags?: CardTag[]
  stateId?: string
  sourceState?: State
  exileOnPlay?: boolean
}

const MEMORY_TAG_ID = 'tag-memory'

export class StateAction extends Action {
  readonly type: ActionType = 'skill'
  private readonly baseTags: CardTag[]
  private readonly stateId?: string
  private readonly stateValue?: State
  private readonly exileOnPlay: boolean

  constructor(props: StateActionProps) {
    super({
      name: props.name,
      cardDefinition: props.cardDefinition,
      gainStates: props.gainStates,
    })
    this.baseTags = props.tags ? [...props.tags] : []
    this.stateId = props.stateId
    this.stateValue = props.sourceState
    this.exileOnPlay = props.exileOnPlay !== false
  }

  override cost(context?: ActionCostContext): number {
    const mergedTags = [...(context?.cardTags ?? []), ...this.baseTags]
    // まず親の計算結果（神聖タグなど共通補正込み）を得る
    let cost = super.cost({
      ...context,
      cardTags: mergedTags,
    })

    // State由来のコスト補正
    return Math.max(0, cost)
  }

  override perform(_context: ActionContext): void {
    const battle = _context.battle as Battle | undefined
    if (battle) {
      const pureBody = battle.getRelicById('pure-body') as PureBodyRelic | undefined
      pureBody?.markUsed?.()
      if (this.stateId) {
        battle.player.removeState(this.stateId)
      }
    }
  }

  get state(): State | undefined {
    return this.stateValue
  }

  get shouldExileOnPlay(): boolean {
    return this.exileOnPlay
  }

  override describe(context?: ActionContext): string {
    // BadState の説明文をそのままカード表示に利用する。なければ定義のタイトルを返す。
    const stateDescription = this.stateValue?.description()
    if (stateDescription && stateDescription.length > 0) {
      return stateDescription
    }
    return this.cardDefinitionBase.title ?? ''
  }
}
