/*
FirstFieldの責務:
- 第一フィールドの一本道構成（スタート → テスト編成 → ハチドリ支援 → ハイオーク小隊 → オーク英雄ボス → ゴール）を定義し、FieldStore/FieldViewへ提供する。
- ノード同士の遷移設定と表示ラベルの付与のみを扱い、報酬生成や難易度スケーリングの責務は持たない。
主な通信相手とインターフェース:
- FieldStore/FieldView: levels配列と各FieldNodeを通じて進行情報を渡す。enemyTeamIdはBattleViewのbuildEnemyTeamFactoryMapで解決されるキー。
- BattleView: enemyTeamIdを受け取るだけで直接参照はしない。start/enemy/boss-enemy/goalノードのみを扱い、報酬系ノード型との混在は行わない。
*/
import { Field, type FieldLevel } from './Field'
import type { BossEnemyNode, EnemyNode, FieldNode, GoalNode, StartNode } from './FieldNode'
import { HummingbirdAlliesTeam, HighOrcSquad, OrcHeroEliteTeam, TestEnemyTeam } from '@/domain/entities/enemyTeams'
import type { EnemyTeam } from '@/domain/entities/EnemyTeam'

const ENEMY_TEAM_FACTORIES: Record<string, () => EnemyTeam> = {
  'test-enemy-team': () => new TestEnemyTeam(),
  'hummingbird-allies': () => new HummingbirdAlliesTeam(),
  'high-orc-squad': () => new HighOrcSquad(),
  'orc-hero-elite': () => new OrcHeroEliteTeam(),
}

export class FirstField extends Field {
  readonly id = 'first-field'
  readonly name = 'First Field'
  readonly levels: FieldLevel[]

  constructor() {
    super()
    this.levels = buildLevels()
  }
}

function buildLevels(): FieldLevel[] {
  const nodesByLevel: FieldNode[][] = [
    [createStartNode()],
    [createEnemyNode('test-enemy-team', 2, 0)],
    [createEnemyNode('hummingbird-allies', 3, 0)],
    [createEnemyNode('high-orc-squad', 4, 0)],
    [createBossEnemyNode('orc-hero-elite', 5, 0)],
    [createGoalNode(6, 0)],
  ]

  return nodesByLevel.map((nodes, levelIdx, arr) => {
    const next = arr[levelIdx + 1]
    nodes.forEach((node) => {
      node.level = levelIdx + 1
      node.nextNodeIndices = next ? next.map((_, idx) => idx) : []
    })
    return { level: levelIdx + 1, nodes }
  })
}

function createStartNode(): StartNode {
  return {
    id: 'start-1',
    type: 'start',
    level: 1,
    label: '入口',
    nextNodeIndices: [],
  }
}

function createEnemyNode(teamId: string, level: number, idx: number, bonusLevels = 0): EnemyNode {
  const teamFactory = ENEMY_TEAM_FACTORIES[teamId]
  const team = teamFactory?.()
  const labelName = team?.name ?? teamId
  return {
    id: `enemy-${level}-${idx}`,
    type: 'enemy',
    level,
    label: `敵「${labelName}」`,
    enemyTeamId: teamId,
    bonusLevels: bonusLevels > 0 ? bonusLevels : undefined,
    nextNodeIndices: [],
  }
}

function createBossEnemyNode(teamId: string, level: number, idx: number): BossEnemyNode {
  const teamFactory = ENEMY_TEAM_FACTORIES[teamId]
  const team = teamFactory?.()
  const labelName = team?.name ?? teamId
  return {
    id: `boss-${level}-${idx}`,
    type: 'boss-enemy',
    level,
    label: `ボス「${labelName}」`,
    enemyTeamId: teamId,
    nextNodeIndices: [],
  }
}

function createGoalNode(level: number, idx: number): GoalNode {
  return {
    id: `goal-${level}-${idx}`,
    type: 'goal',
    level,
    label: 'ゴール',
    nextNodeIndices: [],
  }
}
