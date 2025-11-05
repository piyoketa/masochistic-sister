/*
IronBloomTeam.ts の責務:
- シナリオ2「鉄花チーム」戦で使用する敵編成（オークランサー／かまいたち／鉄花／なめくじ）を初期化し、`EnemyTeam` に登録する。
- 個別敵クラスの生成と並び順の管理のみを担い、戦闘ロジックは EnemyTeam 基底クラスへ委譲する。

責務ではないこと:
- 行動予約や追い風対象選択といったランタイム制御。これらは EnemyTeam / AllyBuffSkill 側の共通ロジックが担当する。
- 敵ステータスの動的更新（被弾・逃走など）。
*/
import { EnemyTeam } from '../EnemyTeam'
import {
  OrcLancerEnemy,
  KamaitachiEnemy,
  IronBloomEnemy,
  SlugEnemy,
} from '../enemies'

export class IronBloomTeam extends EnemyTeam {
  constructor() {
    super({
      id: 'enemy-team-iron-bloom',
      members: [
        new OrcLancerEnemy(),
        new KamaitachiEnemy(),
        new IronBloomEnemy(),
        new SlugEnemy(),
      ],
    })
  }
}
