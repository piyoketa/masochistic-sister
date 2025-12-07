import { Field, type FieldLevel } from './Field'
import type {
  BossEnemyNode,
  EnemyNode,
  FieldNode,
  RandomCardRewardNode,
  RelicRewardNode,
  StartNode,
} from './FieldNode'
import { SnailTeam, IronBloomTeam, HummingbirdAlliesTeam, OrcWrestlerTeam, HighOrcBandTeam, OrcHeroEliteTeam } from '@/domain/entities/enemyTeams'
import type { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { listStandardSkillRewardBlueprints } from '@/domain/library/Library'

const SKILL_CARD_CANDIDATES = listStandardSkillRewardBlueprints()

const ENEMY_TEAM_FACTORIES: Record<string, () => EnemyTeam> = {
  snail: () => new SnailTeam(),
  'iron-bloom': () => new IronBloomTeam({ mode: 'random' }),
  'hummingbird-allies': () => new HummingbirdAlliesTeam(),
  'orc-wrestler-team': () => new OrcWrestlerTeam(),
  'high-orc-band': () => new HighOrcBandTeam(),
  'orc-hero-elite': () => new OrcHeroEliteTeam(),
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

function buildLevels(ownedRelics: string[]): FieldLevel[] {
  const levels: FieldLevel[] = []

  const level1: StartNode = {
    id: 'start-1',
    type: 'start',
    level: 1,
    label: 'スタートマス',
    nextNodeIndices: [],
  }

  const level2: RelicRewardNode[] = [
    createRelicRewardNode(2, 0, ownedRelics),
  ]

  const level3: RandomCardRewardNode[] = [
    createRandomSkillRewardNode(3, 0),
  ]

  const level4: EnemyNode[] = [
    createEnemyNode('snail', 4, 0),
    createEnemyNode('iron-bloom', 4, 1),
  ]

  const level5: RandomCardRewardNode[] = [
    createRandomSkillRewardNode(5, 0),
  ]

  const level6: EnemyNode[] = [
    createEnemyNode('hummingbird-allies', 6, 0),
    createEnemyNode('orc-wrestler-team', 6, 1),
  ]

  const level7: RandomCardRewardNode[] = [
    createRandomSkillRewardNode(7, 0),
  ]

  const level8: EnemyNode[] = [
    createEnemyNode('high-orc-band', 8, 0),
  ]

  const level9: EnemyNode[] = [
    createEnemyNode('orc-hero-elite', 9, 0),
  ]

  const nodesByLevel: FieldNode[][] = [ [level1], level2, level3, level4, level5, level6, level7, level8, level9 ]

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

function createRelicRewardNode(level: number, idx: number, owned: string[]): RelicRewardNode {
  const candidateRelics = ['LightweightCombatRelic', 'PureBodyRelic', 'NoViolenceRelic', 'ArcaneAdaptationRelic', 'ThoroughPreparationRelic']
  const available = candidateRelics.filter((name) => !owned.includes(name))
  const relic = available[Math.floor(Math.random() * available.length)] ?? candidateRelics[0] ?? 'PureBodyRelic'
  return {
    id: `relic-reward-${level}-${idx}`,
    type: 'relic-reward',
    level,
    // マップ上では具体的なレリック名を秘匿し「レリックを獲得」のみ表示する
    label: 'レリックを獲得',
    candidateRelics,
    drawCount: 1,
    nextNodeIndices: [],
  }
}

function createRandomSkillRewardNode(level: number, idx: number): RandomCardRewardNode {
  const selected = pickUnique(SKILL_CARD_CANDIDATES, 3)
  return {
    id: `random-skill-${level}-${idx}`,
    type: 'random-card-reward',
    level,
    label: 'スキルカード褒賞（３枚から１枚）',
    candidateActions: [...SKILL_CARD_CANDIDATES],
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
