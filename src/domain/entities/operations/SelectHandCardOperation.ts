/*
SelectHandCardOperation.ts の責務:
- プレイヤーの手札からカードを指定し、アクションへ渡すための `Operation` 実装を提供する。
- 入力として渡されたカードID（数値またはオブジェクト）を検証し、`Battle.hand.find` を通じて対象カードを特定する。
- 完了後は選択したカードのリポジトリIDをメタデータへ格納し、後続処理（ログやビュー表示）が参照できるようにする。

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

export class SelectHandCardOperation extends Operation<Card> {
  static readonly TYPE = 'select-hand-card'

  constructor() {
    super(SelectHandCardOperation.TYPE)
  }

  protected resolve(payload: unknown, context: OperationContext): Card {
    const cardId = this.extractCardId(payload)
    const card = context.battle.hand.find(cardId)
    if (!card) {
      throw new Error(`Card ${cardId} not found in hand`)
    }

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
}
