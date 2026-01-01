/*
StatusImmunityTrait.ts の責務:
- 敵が所持している場合、Enemy.addState 経由のあらゆる状態付与を拒否する「状態異常無効」Traitを表現する。
- addState 側で参照される識別子（trait-status-immunity）を提供し、他のロジックがこのTraitの有無を判定できるようにする。

責務ではないこと:
- 既に保持しているStateの削除やターン進行イベントへの反応。付与拒否のフラグ提供に限定する。
- プレイヤー側の状態付与制御（今回は敵専用Trait）。

主要な通信相手:
- `Enemy.addState`: このTraitの存在を見て新規State付与をスキップする。
- `STATE_FACTORY`: スナップショット復元時に本Traitを生成する。
*/
import { TraitState } from '../State'

export class StatusImmunityTrait extends TraitState {
  constructor() {
    super({
      id: 'trait-status-immunity',
      name: '状態異常無効',
      stackable: false,
      isImportant: true,
    })
  }

  override description(): string {
    return '状態異常を受けない\n（天の鎖は有効）'
  }
}
