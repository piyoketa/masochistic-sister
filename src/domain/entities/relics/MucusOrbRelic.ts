/*
MucusOrbRelic の責務:
- 1 戦闘 1 回まで自身に「粘液」状態を付与する起動レリックとして振る舞う。
- ActiveRelic 基盤を通じて使用回数やマナ支払い、起動可否の判断を行う。

非責務:
- 「粘液」状態の効果内容や数値調整（StickyState が担当）。
- 入力キューやアニメーション制御（Battle/OperationRunner/ViewManager が担当）。

主な通信相手:
- `Battle` / `Player`: 起動時のコンテキストを受け取り、Action 実行を委譲する。
- `MucusOrbAction`: 実際の状態付与を行う Action。
*/
import type { ActiveRelicContext } from './ActiveRelic'
import { ActiveRelic } from './ActiveRelic'
import { MucusOrbAction } from '../actions/MucusOrbAction'

export class MucusOrbRelic extends ActiveRelic {
  constructor() {
    super({
      id: 'mucus-orb',
      name: '粘液玉',
      icon: '🟢',
      manaCost: 0,
      usageLimitPerBattle: 1,
    })
  }

  description(): string {
    return '起動：自身に状態異常「粘液(1点)」を付与する。1戦闘につき1回だけ使用可能。'
  }

  protected createAction(_context: ActiveRelicContext) {
    return new MucusOrbAction()
  }
}
