/*
RetainCardTag の責務:
- カードの「ターン終了時に手札へ残る（保留）」性質を表す CardDestinationTag を提供する。
- UI とバトル処理が共通の判定軸で保留カードを識別できるようにする。

非責務:
- ターン終了時の手札処理の実装（Battle 側が担当）。
- 使用後の移動先や消滅判定（Card / StateAction が担当）。

主な通信相手:
- `Battle.discardNonRetainHandCards` などの手札整理ロジック: tag.id を参照して保持対象を判定する。
- `useHandPresentation` / `cardInfoBuilder`: CardDestinationTag として表示カテゴリに振り分ける。
*/
import { CardDestinationTag } from '../CardTag'

export class RetainCardTag extends CardDestinationTag {
  constructor() {
    super({
      id: 'tag-retain',
      name: '保留',
      description: 'ターン終了時に捨て札へ送られず、手札に残る。',
    })
  }
}
