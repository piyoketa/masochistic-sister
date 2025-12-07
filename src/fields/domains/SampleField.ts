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
import { shopManager } from '@/domain/shop/ShopManager'

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
const MAX_ENEMIES = 5

export class SampleField extends Field {
  readonly id = 'sample-field'
  readonly name = 'Sample Field'
  readonly levels: FieldLevel[]

  constructor(ownedRelics: string[] = []) {
    super()
    // フィールド初期化時にショップの品揃えを決定する（所持レリックを考慮）
    shopManager.setupOffers({ ownedRelics })
    this.levels = buildLevels(ownedRelics)
  }
}

function buildLevels(ownedRelics: string[]): FieldLevel[] {
  const levels: FieldLevel[] = []

  // Level1: スタート
  const level1: StartNode = {
    id: 'start-1',
    type: 'start',
    level: 1,
    label: 'スタートマス',
    nextNodeIndices: [],
  }

  // Level2: 通常敵（snail / iron-bloom 固定）
  const level2: FieldNode[] = [
    createEnemyNode('snail', 2, 0),
    createEnemyNode('iron-bloom', 2, 1),
  ]

  // Level3-4: 残り通常敵＋ランダム1体（計4体）を2体ずつ割り振り
  const remainingNormals = ['hummingbird-allies', 'orc-wrestler-team', 'gun-goblin-team']
  const extraNormal = NORMAL_ENEMY_POOL[Math.floor(Math.random() * NORMAL_ENEMY_POOL.length)]!
  const normalPool = shuffleArray([...remainingNormals, extraNormal])
  const level3: FieldNode[] = [
    createEnemyNode(normalPool[0] ?? 'hummingbird-allies', 3, 0),
    createEnemyNode(normalPool[1] ?? 'orc-wrestler-team', 3, 1),
  ]
  const level4: FieldNode[] = [
    createEnemyNode(normalPool[2] ?? 'gun-goblin-team', 4, 0),
    createEnemyNode(normalPool[3] ?? extraNormal, 4, 1),
  ]

  // Level5: ボス
  const eliteNodes: BossEnemyNode[] = shuffleArray([...ELITE_POOL])
    .slice(0, 2)
    .map((teamId, idx) => {
      const teamFactory = ENEMY_TEAM_FACTORIES[teamId]
      const team = teamFactory ? teamFactory() : new SnailTeam()
      const labelName = team.name ?? teamId
      return {
        id: `boss-${idx + 1}`,
        type: 'boss-enemy',
        level: 5,
        label: `BOSS「${labelName}」`,
        enemyTeamId: teamId,
        nextNodeIndices: [],
      }
    })

  const nodesByLevel: FieldNode[][] = [[level1], level2, level3, level4, eliteNodes]

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

function createEnemyNode(teamId: string, level: number, idx: number): EnemyNode {
  const teamFactory = ENEMY_TEAM_FACTORIES[teamId]
  const team = teamFactory ? teamFactory() : new SnailTeam()
  const labelName = team.name ?? teamId
  return {
    id: `enemy-${level}-${idx}`,
    type: 'enemy',
    level,
    label: `敵「${labelName}」`,
    enemyTeamId: teamId,
    nextNodeIndices: [],
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    const target = copy[j]
    if (temp === undefined || target === undefined) {
      continue
    }
    copy[i] = target
    copy[j] = temp
  }
  return copy
}
