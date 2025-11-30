import { Field, type FieldLevel } from './Field'
import type {
  CardRewardNode,
  EnemyNode,
  FieldNode,
  RelicRewardNode,
  StartNode,
  RandomCardRewardNode,
  FixedRelicRewardNode,
  BossEnemyNode,
} from './FieldNode'
import {
  SnailTeam,
  IronBloomTeam,
  HummingbirdAlliesTeam,
  OrcWrestlerTeam,
  GunGoblinTeam,
  OrcHeroEliteTeam,
  HighOrcBandTeam,
  BeamCannonEliteTeam,
  GiantSlugEliteTeam,
} from '@/domain/entities/enemyTeams'
import type { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { getRelicInfo } from '@/domain/entities/relics/relicLibrary'

const ENEMY_TEAM_FACTORIES: Record<string, () => EnemyTeam> = {
  snail: () => new SnailTeam(),
  'iron-bloom': () => new IronBloomTeam({ mode: 'random' }),
  'hummingbird-allies': () => new HummingbirdAlliesTeam(),
  'orc-wrestler-team': () => new OrcWrestlerTeam(),
  'gun-goblin-team': () => new GunGoblinTeam(),
  'orc-hero-elite': () => new OrcHeroEliteTeam(),
  'high-orc-band': () => new HighOrcBandTeam(),
  'beam-cannon-elite': () => new BeamCannonEliteTeam(),
  'giant-slug-elite': () => new GiantSlugEliteTeam(),
}

const NORMAL_ENEMY_POOL = ['snail', 'iron-bloom', 'hummingbird-allies', 'orc-wrestler-team', 'gun-goblin-team']
const ELITE_POOL = ['orc-hero-elite', 'high-orc-band', 'beam-cannon-elite', 'giant-slug-elite']
const CARD_CANDIDATES = [
  'battle-prep',
  'daily-routine',
  'predicament',
  'non-violence-prayer',
  'reload',
  'scar-regeneration',
  'life-drain-skill',
]
const RELIC_CANDIDATES = [
  'LightweightCombatRelic',
  'PureBodyRelic',
  'NoViolenceRelic',
  'ArcaneAdaptationRelic',
  'ThoroughPreparationRelic',
]

const MAX_ENEMIES = 5

export class SampleField extends Field {
  readonly id = 'sample-field'
  readonly name = 'Sample Field'
  readonly levels: FieldLevel[]

  constructor(ownedRelics: string[] = []) {
    super()
    this.levels = buildLevels(ownedRelics)
  }
}

function buildLevels(ownedRelics: string[]): FieldLevel[] {
  const levels: FieldLevel[] = []

  const level1: StartNode = {
    id: 'start-1',
    type: 'start',
    level: 1,
    label: 'スタートマス',
    nextNodeIndices: [],
  }
  const cardReward: CardRewardNode = {
    id: 'card-reward-1',
    type: 'card-reward',
    level: 2, // 後続で一括上書き
    label: 'カード獲得マス',
    candidateActions: [...CARD_CANDIDATES],
    drawCount: 3,
    nextNodeIndices: [],
  }
  const relicReward: RelicRewardNode = {
    id: 'relic-reward-1',
    type: 'relic-reward',
    level: 3, // 後続で一括上書き
    label: 'レリック獲得マス',
    candidateRelics: [...RELIC_CANDIDATES],
    drawCount: 1,
    nextNodeIndices: [],
  }

  const level4to7: FieldNode[][] = []
  for (let level = 4; level <= 7; level += 1) {
    const nodes: FieldNode[] = []
    for (let i = 0; i < 3; i += 1) {
      const roll = Math.random()
      if (roll < 0.6) {
        nodes.push(createNormalEnemyNode(level, i))
      } else if (roll < 0.8) {
        nodes.push(createRandomCardRewardNode(level, i))
      } else {
        nodes.push(createFixedRelicRewardNode(level, i, ownedRelics))
      }
    }
    level4to7.push(nodes)
  }

  const eliteNodes: BossEnemyNode[] = shuffleArray([...ELITE_POOL])
    .slice(0, 2)
    .map((teamId, idx) => {
      const teamFactory = ENEMY_TEAM_FACTORIES[teamId]
      const team = teamFactory ? teamFactory() : new SnailTeam()
      const labelName = team.name ?? teamId
      return {
        id: `boss-${idx + 1}`,
        type: 'boss-enemy',
        level: 8,
        label: `BOSS「${labelName}」`,
        enemyTeamId: teamId,
        nextNodeIndices: [],
      }
    })

  const nodesByLevel: FieldNode[][] = [[level1], [cardReward], [relicReward], ...level4to7, eliteNodes]

  nodesByLevel.forEach((nodes, idx) => {
    const next = nodesByLevel[idx + 1]
    nodes.forEach((node) => {
      node.level = idx + 1
      if (next) {
        node.nextNodeIndices = next.map((_, nextIdx) => nextIdx)
      } else {
        node.nextNodeIndices = []
      }
    })
    levels.push({ level: idx + 1, nodes })
  })

  return levels
}

function createNormalEnemyNode(level: number, idx: number): EnemyNode {
  const teamId = NORMAL_ENEMY_POOL[Math.floor(Math.random() * NORMAL_ENEMY_POOL.length)]!
  const teamFactory = ENEMY_TEAM_FACTORIES[teamId]
  const team = teamFactory ? teamFactory() : new SnailTeam()
  const enemy = team.members[Math.floor(Math.random() * Math.min(team.members.length, MAX_ENEMIES))]
  const labelName = enemy?.name ?? teamId
  return {
    id: `enemy-${level}-${idx}`,
    type: 'enemy',
    level,
    label: `敵「${labelName}」`,
    enemyTeamId: teamId,
    nextNodeIndices: [],
  }
}

function createRandomCardRewardNode(level: number, idx: number): RandomCardRewardNode {
  const selected = pickUnique(CARD_CANDIDATES, 3)
  return {
    id: `random-card-${level}-${idx}`,
    type: 'random-card-reward',
    level,
    label: 'カード獲得（３枚から１枚選択）',
    candidateActions: [...CARD_CANDIDATES],
    selectedActions: selected,
    drawCount: 1,
    nextNodeIndices: [],
  }
}

function createFixedRelicRewardNode(level: number, idx: number, owned: string[]): FixedRelicRewardNode {
  const available = RELIC_CANDIDATES.filter((name) => !owned.includes(name))
  const relic = available[0] ?? RELIC_CANDIDATES[0] ?? 'PureBodyRelic'
  const relicName = getRelicInfo(relic)?.name ?? relic
  return {
    id: `fixed-relic-${level}-${idx}`,
    type: 'fixed-relic-reward',
    level,
    label: `レリック「${relicName}」を獲得`,
    candidateRelics: [...RELIC_CANDIDATES],
    selectedRelic: relic,
    nextNodeIndices: [],
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j] as T
    copy[j] = temp
  }
  return copy
}

function pickUnique<T>(arr: T[], count: number): T[] {
  return shuffleArray(arr).slice(0, Math.min(count, arr.length))
}
