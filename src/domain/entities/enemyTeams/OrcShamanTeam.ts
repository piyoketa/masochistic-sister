import { EnemyTeam } from '../EnemyTeam'
import { HighOrcEnemy } from '../enemies/HighOrcEnemy'
import { createHighOrcTrainerB } from '../enemies/HighOrcTrainerBEnemy'
import { createOrcShamanEnemy } from '../enemies/OrcShamanEnemy'

/*
オーク呪術師チーム:
- ハイオーク、ハイオークトレーナーB×2、オーク呪術師の4体構成。
*/
export class OrcShamanTeam extends EnemyTeam {
  constructor() {
    super({
      id: 'orc-shaman-team',
      members: [
        new HighOrcEnemy(),
        createHighOrcTrainerB(),
        createHighOrcTrainerB(),
        createOrcShamanEnemy(),
      ],
    })
  }
}
