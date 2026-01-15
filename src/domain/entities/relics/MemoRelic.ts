/*
MemoRelic の責務:
- 1 戦闘 1 回まで手札1枚に「保留」タグを付与する起動レリックとして振る舞う。
- ActiveRelic 基盤を通じて使用回数やマナ支払い、起動可否の判断を行う。

非責務:
- 「保留」タグの効果内容（ターン終了時の保持判定は Battle が担当）。
- 入力キューやアニメーション制御（Battle/OperationRunner/ViewManager が担当）。

主な通信相手:
- `Battle` / `Player`: 起動時のコンテキストを受け取り、Action 実行を委譲する。
- `MemoRelicAction`: 実際のタグ付与を行う Action。
*/
import type { ActiveRelicContext } from './ActiveRelic'
import { ActiveRelic } from './ActiveRelic'
import { MemoRelicAction } from '../actions/MemoRelicAction'

export class MemoRelic extends ActiveRelic {
  constructor() {
    super({
      id: 'memo-relic',
      name: 'メモ',
      icon: '📝',
      manaCost: 0,
      usageLimitPerBattle: 1,
    })
  }

  description(): string {
    return '起動：手札1枚を選択する。そのカードに「保留」タグを付与する。1戦闘につき1回だけ使用可能。'
  }

  override canActivate(context: ActiveRelicContext): boolean {
    if (!super.canActivate(context)) {
      return false
    }
    // 手札が空の場合は選択操作が成立しないため、起動不可とする。
    return context.battle.hand.list().length > 0
  }

  protected createAction(_context: ActiveRelicContext) {
    return new MemoRelicAction()
  }
}
