/*
DevilStatueField.ts の責務:
- 単一イベント「悪魔の像」のみを含むフィールド定義を提供し、テスト的に呪い選択イベントへ遷移できるようにする。
- FieldView からの経路情報（開始→悪魔の像）を提供し、イベントノードに呪い候補（状態異常カード）と選択数を持たせる。

責務ではないこと:
- 呪いカードの付与処理や UI 表示（DevilStatueRewardView が担当）。
- フィールド進行やマップ描画の複雑な制御（Field/FieldView が担当）。
*/
import { Field, type FieldLevel } from './Field'
import type { DevilStatueNode, StartNode } from './FieldNode'
import type { CardBlueprint } from '@/domain/library/Library'

export const DEVIL_STATUE_CURSE_CANDIDATES: CardBlueprint[] = [
  { type: 'state-evil-thought' }, // 邪念
  { type: 'state-intoxication' }, // 酩酊
  { type: 'state-corrosion' }, // 腐食
  { type: 'state-sticky' }, // 粘液
  { type: 'state-heavyweight' }, // 重量化
]
export const DEVIL_STATUE_SELECTION_COUNT = 2

export class DevilStatueField extends Field {
  readonly id = 'devil-statue'
  readonly name = '悪魔の像'

  readonly levels: FieldLevel[]

  constructor() {
    super()
    const start: StartNode = {
      id: 'start-1',
      type: 'start',
      level: 1,
      nextNodeIndices: [0],
      label: 'スタート',
    }

    const statueNode: DevilStatueNode = {
      id: 'devil-statue-2',
      type: 'devil-statue',
      level: 2,
      label: '悪魔の像',
      nextNodeIndices: [],
      curses: DEVIL_STATUE_CURSE_CANDIDATES,
      selectionCount: DEVIL_STATUE_SELECTION_COUNT,
    }

    this.levels = [
      { level: 1, nodes: [start] },
      { level: 2, nodes: [statueNode] },
    ]
  }
}
