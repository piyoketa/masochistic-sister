/*
RedrawRelic の責務:
- 戦闘中1回だけ起動できる「リドロー」効果を提供し、手札の状態異常以外を全て捨ててから4枚引くアクションを実行する。
- ActiveRelic 基盤を利用してマナコストや使用回数の管理、実行時コンテキストの引き回しを行う。

非責務:
- UI での起動ボタン表示や入力制御（View/Battle が担当）。
- 捨て札・ドロー処理の詳細な実装（RedrawRelicAction / Battle が担当）。

主な通信相手:
- `Battle` / `Player`: perform 内で使用可能判定とアクション実行のためのコンテキストを受け取る。
- `RedrawRelicAction`: 実際のカード移動とドロー処理を行うアクション。
*/
import type { ActiveRelicContext } from './ActiveRelic'
import { ActiveRelic } from './ActiveRelic'
import { RedrawRelicAction } from '../actions/RedrawRelicAction'

export class RedrawRelic extends ActiveRelic {
  constructor() {
    super({
      id: 'redraw-relic',
      name: 'リドロー',
      icon: '🔄',
      manaCost: 0,
      usageLimitPerBattle: 1,
    })
  }

  description(): string {
    return '起動：手札の状態異常以外を全て捨て、カードを4枚引く（戦闘中1回まで）'
  }

  protected createAction(_context: ActiveRelicContext) {
    return new RedrawRelicAction()
  }
}
