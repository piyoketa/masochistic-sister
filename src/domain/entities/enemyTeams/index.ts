export { SnailTeam } from './SnailTeam'
export { TestEnemyTeam } from './TestEnemyTeam'
export { IronBloomTeam } from './IronBloomTeam'
export { HummingbirdAlliesTeam } from './HummingbirdAlliesTeam'
export { OrcHeroEliteTeam } from './OrcHeroEliteTeam'
export { TestSlug5HpTeam } from './TestSlug5HpTeam'
export { OrcWrestlerTeam } from './OrcWrestlerTeam'
export { TestOrcWrestlerTeam } from './TestOrcWrestlerTeam'
export { GunGoblinTeam } from './GunGoblinTeam'
export { HighOrcBandTeam } from './HighOrcBandTeam'
export { BeamCannonEliteTeam } from './BeamCannonEliteTeam'
export { GiantSlugEliteTeam } from './GiantSlugEliteTeam'
export { OrcSumoSquad } from './OrcSumoSquad'
export { HighOrcSquad } from './HighOrcSquad'
export { TutorialEnemyTeam } from './TutorialEnemyTeam'
export { GreatShieldOrcTeam } from './GreatShieldOrcTeam'
export { OrcShamanTeam } from './OrcShamanTeam'

export type EnemyTeamFactoryOptions = {
  bonusLevels?: number
  rng?: () => number
} & Record<string, unknown>

import type { EnemyTeam } from '../EnemyTeam'
import { SnailTeam } from './SnailTeam'
import { TestEnemyTeam } from './TestEnemyTeam'
import { IronBloomTeam } from './IronBloomTeam'
import { HummingbirdAlliesTeam } from './HummingbirdAlliesTeam'
import { OrcHeroEliteTeam } from './OrcHeroEliteTeam'
import { TestSlug5HpTeam } from './TestSlug5HpTeam'
import { OrcWrestlerTeam } from './OrcWrestlerTeam'
import { TestOrcWrestlerTeam } from './TestOrcWrestlerTeam'
import { GunGoblinTeam } from './GunGoblinTeam'
import { HighOrcBandTeam } from './HighOrcBandTeam'
import { BeamCannonEliteTeam } from './BeamCannonEliteTeam'
import { GiantSlugEliteTeam } from './GiantSlugEliteTeam'
import { OrcSumoSquad } from './OrcSumoSquad'
import { HighOrcSquad } from './HighOrcSquad'
import { TutorialEnemyTeam } from './TutorialEnemyTeam'
import { GreatShieldOrcTeam } from './GreatShieldOrcTeam'
import { OrcShamanTeam } from './OrcShamanTeam'

/**
 * 敵チームIDとファクトリ関数のマッピングを返す。
 * BattleView などで個別登録をせず、この一覧から敵チームを解決できるようにする。
 */
export function buildEnemyTeamFactoryMap(): Record<string, (options?: EnemyTeamFactoryOptions) => EnemyTeam> {
  return {
    'snail-team': (options) => new SnailTeam(options),
    snail: (options) => new SnailTeam(options),
    'test-enemy-team': (options) => new TestEnemyTeam(options),
    'iron-bloom-team': (options) => new IronBloomTeam({ mode: 'random', ...options }),
    'iron-bloom-scripted': (options) => new IronBloomTeam({ mode: 'scripted', ...options }),
    'hummingbird-allies': (options) => new HummingbirdAlliesTeam(options),
    'orc-hero-elite': (options) => new OrcHeroEliteTeam(options),
    'test-slug-5hp': (options) => new TestSlug5HpTeam(options),
    'orc-wrestler-team': (options) => new OrcWrestlerTeam(options),
    'test-orc-wrestler-team': (options) => new TestOrcWrestlerTeam(options),
    'gun-goblin-team': (options) => new GunGoblinTeam(options),
    'high-orc-band': (options) => new HighOrcBandTeam(options),
    'beam-cannon-elite': (options) => new BeamCannonEliteTeam(options),
    'giant-slug-elite': (options) => new GiantSlugEliteTeam(options),
    'orc-sumo-squad': (options) => new OrcSumoSquad(options),
    'high-orc-squad': (options) => new HighOrcSquad(options),
    'enemy-team-tutorial': (options) => new TutorialEnemyTeam(options),
    'great-shield-orc-team': (options) => new GreatShieldOrcTeam(options),
    'orc-shaman-team': (options) => new OrcShamanTeam(options),
  }
}
