/*
SelectHandCardOperation.ts の責務:
- プレイヤーの手札からカードを指定し、アクションへ渡すための `Operation` 実装を提供する。
- 入力として渡されたカードID（数値またはオブジェクト）を検証し、`Battle.hand.find` を通じて対象カードを特定する。
- 完了後は選択したカードのリポジトリIDをメタデータへ格納し、後続処理（ログやビュー表示）が参照できるようにする。
- 追加要件として `filter` コールバックを受け取り、用途ごとに選択可能なカードの条件（記憶カード限定など）を絞り込めるようにする。

責務ではないこと:
- カード選択の要求タイミングやキャンセル処理。これらはアクション側や UI 層（`BattleHandArea` など）が制御する。
- 手札入れ替えや消費等、カード実体の移動／消費。選択後にどう扱うかは呼び出し元のアクションが担う。

主要な通信相手とインターフェース:
- `OperationContext.battle.hand`: `find` メソッドを利用してカードを検索し、存在しなければ例外を投げる。
- `HandSwapAction` などのアクション: `SelectHandCardOperation` を要求することで手札カードの選択を収集し、`metadata.selectedHandCardId` を基に処理を続行する。
- `TargetEnemyOperation`: 同じ Operation 系列だが、カードではなく敵エンティティを扱う点と、使用する Battle サブシステム（hand vs enemyTeam）が異なる。
*/
import type { Card } from '../Card'
import { Operation, type OperationContext } from './OperationBase'

export interface HandCardSelectionAvailabilityEntry {
  cardId: number
  selectable: boolean
  reason?: string
}

export interface SelectHandCardOperationConfig {
  filter?: (card: Card, context: OperationContext) => boolean
  filterMessage?: string
}

export class SelectHandCardOperation extends Operation<Card> {
  static readonly TYPE = 'select-hand-card'

  private readonly filter?: (card: Card, context: OperationContext) => boolean
  private readonly filterMessage: string

  constructor(config: SelectHandCardOperationConfig = {}) {
    super(SelectHandCardOperation.TYPE)
    this.filter = config.filter
    this.filterMessage = config.filterMessage ?? '選択できないカードが指定されました'
  }

  protected resolve(payload: unknown, context: OperationContext): Card {
    const cardId = this.extractCardId(payload)
    const card = context.battle.hand.find(cardId)
    if (!card) {
      throw new Error(`Card ${cardId} not found in hand`)
    }

    this.ensureSelectable(card, context)

    return card
  }

  override toMetadata(): Record<string, unknown> {
    const id = this.card.id
    if (id === undefined) {
      throw new Error('Selected hand card missing repository id')
    }

    return {
      selectedHandCardId: id,
    }
  }

  get card(): Card {
    if (!this.resultValue) {
      throw new Error('Operation not completed')
    }

    return this.resultValue
  }

  describeAvailability(context: OperationContext): HandCardSelectionAvailabilityEntry[] {
    const cards = context.battle.hand.list()
    return cards
      .filter((card) => card.id !== undefined)
      .map((card) => {
        const cardId = card.id as number
        const selectable = this.filter ? this.filter(card, context) : true
        return {
          cardId,
          selectable,
          reason: selectable ? undefined : this.filterMessage,
        }
      })
  }

  private extractCardId(payload: unknown): number {
    if (typeof payload === 'number' && Number.isInteger(payload) && payload >= 0) {
      return payload
    }

    if (typeof payload === 'object' && payload !== null) {
      const candidate = (payload as { cardId?: number; selectedHandCardId?: number }).cardId ??
        (payload as { selectedHandCardId?: number }).selectedHandCardId

      if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0) {
        return candidate
      }
    }

    throw new Error('Operation requires a numeric hand card id')
  }

  private ensureSelectable(card: Card, context: OperationContext): void {
    if (this.filter && !this.filter(card, context)) {
      throw new Error(this.filterMessage)
    }
  }
}
