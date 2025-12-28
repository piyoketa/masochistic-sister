/*
OrcHeroEliteTeam.ts の責務:
- 「オークヒーロー・エリート戦」の固定編成（オークヒーロー／コウモリ／かまいたち／なめくじ）を構築し、バトル開始時の敵チーム状態を提供する。
- 各 Enemy インスタンスを EnemyRepository に登録し、以降の行動管理やターン処理で一貫した参照を可能にする。

責務ではないこと:
- 個々の敵アクションの挙動調整（各 Enemy クラスや Action が担当）。
- 戦闘難易度の調整ロジックや進行管理（Battle/BattlePreset 側が担当）。

主要な連携相手とインターフェース:
- `OrcHeroEnemy`/`BatEnemy`/`KamaitachiEnemy`/`SlugEnemy`: チームメンバーとして生成し、EnemyTeam の turnOrder に登録する。
- `EnemyTeam`: 基底クラスとして turn/行動フェーズのハンドリングを提供し、本クラスはメンバー提供のみに注力する。
- `EnemyRepository`: コンストラクタ内でメンバー登録を行い、ID 付与を受ける。
*/
import { EnemyTeam } from '../EnemyTeam'
import {
  OrcHeroEnemy,
  SuccubusEnemy,
  OrcSumoEnemy,
  SlugEnemy,
} from '../enemies'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface OrcHeroEliteTeamOptions {
  // ボス戦なので追加レベルは無視する。
  bonusLevels?: number
  rng?: () => number
}

export class OrcHeroEliteTeam extends EnemyTeam {
  constructor(options?: OrcHeroEliteTeamOptions) {
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) => new OrcHeroEnemy({ level }),
        (level) => new SuccubusEnemy({ level }),
        (level) => new OrcSumoEnemy({ level }),
        (level) => new SlugEnemy({ level }),
      ],
      0,
      rng,
    )
    super({
      id: 'orc-hero-elite',
      name: 'オークヒーロー',
      members,
    })
  }
}
