export { SnailTeam } from './SnailTeam'
export { TestEnemyTeam } from './TestEnemyTeam'
export { IronBloomTeam } from './IronBloomTeam'
export { HummingbirdAlliesTeam } from './HummingbirdAlliesTeam'
export { OrcHeroEliteTeam } from './OrcHeroEliteTeam'
export { TestSlug5HpTeam } from './TestSlug5HpTeam'
export { OrcWrestlerTeam } from './OrcWrestlerTeam'
export { GunGoblinTeam } from './GunGoblinTeam'
export { HighOrcBandTeam } from './HighOrcBandTeam'
export { BeamCannonEliteTeam } from './BeamCannonEliteTeam'
export { GiantSlugEliteTeam } from './GiantSlugEliteTeam'
export { OrcSumoSquad } from './OrcSumoSquad'
export { HighOrcSquad } from './HighOrcSquad'
export { TutorialEnemyTeam } from './TutorialEnemyTeam'
export { GreatShieldOrcTeam } from './GreatShieldOrcTeam'

import type { EnemyTeam } from '../EnemyTeam'
import { SnailTeam } from './SnailTeam'
import { TestEnemyTeam } from './TestEnemyTeam'
import { IronBloomTeam } from './IronBloomTeam'
import { HummingbirdAlliesTeam } from './HummingbirdAlliesTeam'
import { OrcHeroEliteTeam } from './OrcHeroEliteTeam'
import { TestSlug5HpTeam } from './TestSlug5HpTeam'
import { OrcWrestlerTeam } from './OrcWrestlerTeam'
import { GunGoblinTeam } from './GunGoblinTeam'
import { HighOrcBandTeam } from './HighOrcBandTeam'
import { BeamCannonEliteTeam } from './BeamCannonEliteTeam'
import { GiantSlugEliteTeam } from './GiantSlugEliteTeam'
import { OrcSumoSquad } from './OrcSumoSquad'
import { HighOrcSquad } from './HighOrcSquad'
import { TutorialEnemyTeam } from './TutorialEnemyTeam'
import { GreatShieldOrcTeam } from './GreatShieldOrcTeam'

/**
 * 敵チームIDとファクトリ関数のマッピングを返す。
 * BattleView などで個別登録をせず、この一覧から敵チームを解決できるようにする。
 */
export function buildEnemyTeamFactoryMap(): Record<string, () => EnemyTeam> {
  return {
    snail: () => new SnailTeam(),
    'test-enemy-team': () => new TestEnemyTeam(),
    'iron-bloom': () => new IronBloomTeam({ mode: 'random' }),
    'iron-bloom-scripted': () => new IronBloomTeam({ mode: 'scripted' }),
    'hummingbird-allies': () => new HummingbirdAlliesTeam(),
    'orc-hero-elite': () => new OrcHeroEliteTeam(),
    'test-slug-5hp': () => new TestSlug5HpTeam(),
    'orc-wrestler-team': () => new OrcWrestlerTeam(),
    'gun-goblin-team': () => new GunGoblinTeam(),
    'high-orc-band': () => new HighOrcBandTeam(),
    'beam-cannon-elite': () => new BeamCannonEliteTeam(),
    'giant-slug-elite': () => new GiantSlugEliteTeam(),
    'orc-sumo-squad': () => new OrcSumoSquad(),
    'high-orc-squad': () => new HighOrcSquad(),
    'enemy-team-tutorial': () => new TutorialEnemyTeam(),
    'great-shield-orc-team': () => new GreatShieldOrcTeam(),
  }
}
