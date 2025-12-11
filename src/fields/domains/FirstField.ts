import { Field, type FieldLevel } from './Field'
import type {
  BossEnemyNode,
  EnemyNode,
  FieldNode,
  RandomCardRewardNode,
  RandomRelicRewardNode,
  StartNode,
} from './FieldNode'
import {
  SnailTeam,
  IronBloomTeam,
  HummingbirdAlliesTeam,
  OrcWrestlerTeam,
  HighOrcBandTeam,
  OrcHeroEliteTeam,
  TestEnemyTeam,
  GunGoblinTeam,
  BeamCannonEliteTeam,
  HighOrcSquad,
} from '@/domain/entities/enemyTeams'
import type { EnemyTeam } from '@/domain/entities/EnemyTeam'
import {
  listStandardSkillRewardBlueprints,
  listAttackSupportRewardBlueprints,
  listAttackSupportRelicClassNames,
  type CardBlueprint,
} from '@/domain/library/Library'

const SKILL_CARD_CANDIDATES = listStandardSkillRewardBlueprints()
const LEVEL2_RELIC_CANDIDATES = listAttackSupportRelicClassNames()
const LEVEL3_CARD_CANDIDATES = listAttackSupportRewardBlueprints()
const LEVEL4_RELIC_CANDIDATES = listAttackSupportRelicClassNames()
const LEVEL5_BOSS_CANDIDATES = ['beam-cannon-elite', 'orc-hero-elite']

const ENEMY_TEAM_FACTORIES: Record<string, () => EnemyTeam> = {
  snail: () => new SnailTeam(),
  'iron-bloom': () => new IronBloomTeam({ mode: 'random' }),
  'test-enemy-team': () => new TestEnemyTeam(),
  'hummingbird-allies': () => new HummingbirdAlliesTeam(),
  'orc-wrestler-team': () => new OrcWrestlerTeam(),
  'high-orc-band': () => new HighOrcBandTeam(),
  'orc-hero-elite': () => new OrcHeroEliteTeam(),
  'gun-goblin-team': () => new GunGoblinTeam(),
  'beam-cannon-elite': () => new BeamCannonEliteTeam(),
  'high-orc-squad': () => new HighOrcSquad(),
}

export class FirstField extends Field {
  readonly id = 'first-field'
  readonly name = 'First Field'
  readonly levels: FieldLevel[]

  constructor(ownedRelics: string[] = []) {
    super()
    this.levels = buildLevels(ownedRelics)
  }
}

function buildLevels(_ownedRelics: string[]): FieldLevel[] {
  const levels: FieldLevel[] = []

  const level1: StartNode = {
    id: 'start-1',
    type: 'start',
    level: 1,
    label: '入口',
    nextNodeIndices: [],
  }

  const level2: EnemyNode[] = [
    createEnemyNode('test-enemy-team', 2, 0),
    createEnemyNode('iron-bloom', 2, 1),
  ]

  const level3: EnemyNode[] = [
    createEnemyNode('hummingbird-allies', 3, 0),
    createEnemyNode('orc-wrestler-team', 3, 1),
  ]

  const level4: EnemyNode[] = [
    createEnemyNode('gun-goblin-team', 4, 0),
    createEnemyNode('high-orc-squad', 4, 1),
  ]

  const selectedBossTeamId =
    pickUnique(LEVEL5_BOSS_CANDIDATES, 1)[0] ?? LEVEL5_BOSS_CANDIDATES[0] ?? 'beam-cannon-elite'
  const level5: BossEnemyNode[] = [createBossEnemyNode(selectedBossTeamId, 5, 0)]

  const nodesByLevel: FieldNode[][] = [[level1], level2, level3, level4, level5]

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

function createBossEnemyNode(teamId: string, level: number, idx: number): BossEnemyNode {
  const teamFactory = ENEMY_TEAM_FACTORIES[teamId]
  const team = teamFactory ? teamFactory() : new SnailTeam()
  const labelName = team.name ?? teamId
  return {
    id: `boss-${level}-${idx}`,
    type: 'boss-enemy',
    level,
    label: `ボス「${labelName}」`,
    enemyTeamId: teamId,
    nextNodeIndices: [],
  }
}

function createRandomRelicRewardNode(
  level: number,
  idx: number,
  candidates: string[],
): RandomRelicRewardNode {
  return {
    id: `random-relic-${level}-${idx}`,
    type: 'random-relic-reward',
    level,
    // マップ上では具体的なレリック名を秘匿し「レリックを獲得」のみ表示する
    label: 'レリックを獲得',
    candidateRelics: [...candidates],
    offerCount: 3,
    // 常に1つだけ獲得できる仕様に固定
    drawCount: 1,
    nextNodeIndices: [],
  }
}

function createRandomSkillRewardNode(
  level: number,
  idx: number,
  candidates: CardBlueprint[] = SKILL_CARD_CANDIDATES,
): RandomCardRewardNode {
  const selected = pickUnique(candidates, 3)
  return {
    id: `random-skill-${level}-${idx}`,
    type: 'random-card-reward',
    level,
    label: 'スキルカード褒賞（３枚から１枚）',
    candidateActions: [...candidates],
    selectedActions: selected,
    drawCount: 1,
    nextNodeIndices: [],
  }
}

function pickUnique<T>(arr: T[], count: number): T[] {
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
  return copy.slice(0, Math.min(count, copy.length))
}
