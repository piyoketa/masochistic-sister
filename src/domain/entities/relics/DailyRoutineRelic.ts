/*
DailyRoutineRelic の責務:
- 戦闘中1回だけ、マナ消費なしで「日課」と同等のドロー効果を起動するアクティブレリックを提供する。

非責務:
- 起動可否のUI制御や入力キュー処理（Battle/ViewManager が担当）。
- ドロー処理の詳細（Battle.drawForPlayer に委譲）。

主な通信相手:
- Battle/Player: `perform` 内でアクション実行のためのコンテキストを受け取り、手札にカードを引く。
- DailyRoutineAction: 実際の効果（2枚ドロー）を実行する Action。
*/
import type { ActiveRelicContext } from './ActiveRelic'
import { ActiveRelic } from './ActiveRelic'
import { DailyRoutineAction } from '../actions/DailyRoutineAction'

export class DailyRoutineRelic extends ActiveRelic {
  constructor() {
    super({
      id: 'daily-routine-relic',
      name: '日課',
      icon: '☀️',
      manaCost: 0,
      usageLimitPerBattle: 1,
    })
  }

  description(): string {
    return '起動：カードを2枚引く（戦闘中1回まで）'
  }

  protected createAction(_context: ActiveRelicContext) {
    return new DailyRoutineAction()
  }
}
