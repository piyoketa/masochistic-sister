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
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { FlurryAction } from '../actions/FlurryAction'
import { MucusShotAction } from '../actions/MucusShotAction'
import { TackleAction } from '../actions/TackleAction'

export interface IronBloomTeamOptions {
  mode?: 'scripted' | 'random'
}

export class IronBloomTeam extends EnemyTeam {
  constructor(options?: IronBloomTeamOptions) {
    const scripted = options?.mode !== 'random'
    super({
      id: 'iron-bloom',
      members: [
        new OrcLancerEnemy(
          scripted
            ? {
                actionQueueFactory: () =>
                  new DefaultEnemyActionQueue({ initialActionType: BattleDanceAction }),
              }
            : undefined,
        ),
        new KamaitachiEnemy(
          scripted
            ? {
                actionQueueFactory: () =>
                  new DefaultEnemyActionQueue({ initialActionType: FlurryAction }),
                rng: () => 0,
              }
            : undefined,
        ),
        new IronBloomEnemy(
          scripted
            ? {
                actionQueueFactory: () =>
                  new DefaultEnemyActionQueue({ initialActionType: MucusShotAction }),
              }
            : undefined,
        ),
        new SlugEnemy(
          scripted
            ? {
                actionQueueFactory: () =>
                  new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
              }
            : undefined,
        ),
      ],
    })
  }
}
