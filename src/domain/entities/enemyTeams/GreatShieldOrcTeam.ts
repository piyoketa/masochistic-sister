import { EnemyTeam } from '../EnemyTeam'
import { createOrcHealerEnemy } from '../enemies/OrcHealerEnemy'
import { createHighOrcTrainer } from '../enemies/HighOrcTrainerEnemy'
import { createHeavyOrc } from '../enemies/HeavyOrcEnemy'
import { createGreatShieldOrc } from '../enemies/GreatShieldOrcEnemy'

/*
大盾オークチーム:
- オーク治療師 / ハイオークトレーナー / 重装オーク / 大盾オーク の4体構成。
- 行動優先や初期Stateは各 Enemy 定義側に委譲する。
*/
export class GreatShieldOrcTeam extends EnemyTeam {
  constructor() {
    super({
      id: 'great-shield-orc-team',
      members: [
        createOrcHealerEnemy(),
        createHighOrcTrainer(),
        createHeavyOrc(),
        createGreatShieldOrc(),
      ],
    })
  }
}
