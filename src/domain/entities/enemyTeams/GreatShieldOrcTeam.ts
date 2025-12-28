import { EnemyTeam } from '../EnemyTeam'
import { createOrcHealerEnemy } from '../enemies/OrcHealerEnemy'
import { createHighOrcTrainer } from '../enemies/HighOrcTrainerEnemy'
import { createHeavyOrc } from '../enemies/HeavyOrcEnemy'
import { createGreatShieldOrc } from '../enemies/GreatShieldOrcEnemy'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface GreatShieldOrcTeamOptions {
  bonusLevels?: number
  rng?: () => number
}

/*
大盾オークチーム:
- オーク治療師 / ハイオークトレーナー / 重装オーク / 大盾オーク の4体構成。
- 行動優先や初期Stateは各 Enemy 定義側に委譲する。
*/
export class GreatShieldOrcTeam extends EnemyTeam {
  constructor(options?: GreatShieldOrcTeamOptions) {
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) => createOrcHealerEnemy({ level }),
        (level) => createHighOrcTrainer({ level }),
        (level) => createHeavyOrc({ level }),
        (level) => createGreatShieldOrc({ level }),
      ],
      bonusLevels,
      rng,
    )
    super({
      id: 'great-shield-orc-team',
      members,
    })
  }
}
