/*
SelectPileCardOperation.ts の責務:
- 山札や捨て札など手札外のカードを選択させ、アクションに渡すための Operation を提供する。
- 入力として渡されたカードID（数値またはオブジェクト）を検証し、指定された pile（deck/discord/exile など）からカードを特定する。
- 完了後は選択したカードのリポジトリIDをメタデータへ格納し、後続処理（ログやビュー表示）が参照できるようにする。

責務ではないこと:
- 選択済みカードをどのように移動するか（手札へ移すなど）はアクション側が担う。
- UI での候補提示やフィルタリング理由表示。UI 側には選択可能な候補のみを渡す前提とし、理由出力は行わない。

主要な通信相手とインターフェース:
- OperationContext.battle の各 pile（deck / discard / exile）。resolve 時に該当 pile からカードを検索し、見つからなければ例外を投げる。
- アクション実装: Operation を要求してカードIDを受け取り、対象カードの移動や効果発動を行う。
*/
import type { Card } from '../Card'
import { Operation, type OperationContext } from './OperationBase'

export type PileType = 'deck' | 'discard' | 'exile'

export interface SelectPileCardOperationPayload {
  cardId?: number
  selectedPileCardId?: number
}

export class SelectPileCardOperation extends Operation<Card> {
  static readonly TYPE = 'select-pile-card'

  private readonly pile: PileType

  constructor(pile: PileType = 'deck') {
    super(SelectPileCardOperation.TYPE)
    this.pile = pile
  }

  protected resolve(payload: unknown, context: OperationContext): Card {
    const cardId = this.extractCardId(payload)
    const card = this.findCardInPile(cardId, context)
    if (!card) {
      throw new Error(`カードID ${cardId} は${this.pile}から見つかりませんでした`)
    }
    return card
  }

  override toMetadata(): Record<string, unknown> {
    const id = this.card.id
    if (id === undefined) {
      throw new Error('選択したカードにIDがありません')
    }

    return {
      selectedPileCardId: id,
      pile: this.pile,
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
      const candidate = (payload as SelectPileCardOperationPayload).cardId ??
        (payload as SelectPileCardOperationPayload).selectedPileCardId
      if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0) {
        return candidate
      }
    }

    throw new Error('select-pile-card には数値の cardId が必要です')
  }

  private findCardInPile(cardId: number, context: OperationContext): Card | undefined {
    switch (this.pile) {
      case 'deck':
        return context.battle.deck.find(cardId)
      case 'discard':
        return context.battle.discardPile.find(cardId)
      case 'exile':
        return context.battle.exilePile.find(cardId)
      default:
        return undefined
    }
  }
}

