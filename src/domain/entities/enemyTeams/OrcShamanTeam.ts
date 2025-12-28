import { EnemyTeam } from '../EnemyTeam'
import { HighOrcEnemy } from '../enemies/HighOrcEnemy'
import { createHighOrcTrainerB } from '../enemies/HighOrcTrainerBEnemy'
import { createOrcShamanEnemy } from '../enemies/OrcShamanEnemy'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface OrcShamanTeamOptions {
  bonusLevels?: number
  rng?: () => number
}

/*
オーク呪術師チーム:
- ハイオーク、ハイオークトレーナーB×2、オーク呪術師の4体構成。
*/
export class OrcShamanTeam extends EnemyTeam {
  constructor(options?: OrcShamanTeamOptions) {
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) => new HighOrcEnemy({ level }),
        (level) => createHighOrcTrainerB({ level }),
        (level) => createHighOrcTrainerB({ level }),
        (level) => createOrcShamanEnemy({ level }),
      ],
      bonusLevels,
      rng,
    )
    super({
      id: 'orc-shaman-team',
      members,
    })
  }
}
