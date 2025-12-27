/*
SecondFieldの責務:
- 第二フィールドの固定構成（スタート → かたつむり/鉄花(スクリプト) → ハチドリ/レスラー → ハイオーク小隊/銃ゴブリン → ビーム砲ボス）を定義し、FieldStore/FieldViewへ供給する。
- ノード遷移と表示ラベル付与に専念し、報酬生成や難易度補正は担当しない。
主な通信相手とインターフェース:
- FieldStore/FieldView: levels配列とFieldNodeを介して進行情報を渡す。enemyTeamIdはBattleViewのbuildEnemyTeamFactoryMapで解決されるキーとなる。
- BattleView: enemyTeamIdを渡すのみで直接参照は持たない。start/enemy/boss-enemyノードのみを扱い、報酬ノードとはインターフェースを共有しない。
*/
import { Field, type FieldLevel } from './Field'
import type { BossEnemyNode, EnemyNode, FieldNode, StartNode } from './FieldNode'
import {
  BeamCannonEliteTeam,
  GunGoblinTeam,
  HighOrcSquad,
  HummingbirdAlliesTeam,
  IronBloomTeam,
  OrcWrestlerTeam,
  SnailTeam,
} from '@/domain/entities/enemyTeams'
import type { EnemyTeam } from '@/domain/entities/EnemyTeam'

const ENEMY_TEAM_FACTORIES: Record<string, () => EnemyTeam> = {
  'snail-team': () => new SnailTeam(),
  'iron-bloom-scripted': () => new IronBloomTeam({ mode: 'scripted' }),
  'hummingbird-allies': () => new HummingbirdAlliesTeam(),
  'orc-wrestler-team': () => new OrcWrestlerTeam(),
  'high-orc-squad': () => new HighOrcSquad(),
  'gun-goblin-team': () => new GunGoblinTeam(),
  'beam-cannon-elite': () => new BeamCannonEliteTeam(),
}

export class SecondField extends Field {
  readonly id = 'second-field'
  readonly name = 'Second Field'
  readonly levels: FieldLevel[]

  constructor() {
    super()
    this.levels = buildLevels()
  }
}

function buildLevels(): FieldLevel[] {
  const nodesByLevel: FieldNode[][] = [
    [createStartNode()],
    [createEnemyNode('snail-team', 2, 0), createEnemyNode('iron-bloom-scripted', 2, 1)],
    [createEnemyNode('hummingbird-allies', 3, 0), createEnemyNode('orc-wrestler-team', 3, 1)],
    [createEnemyNode('high-orc-squad', 4, 0), createEnemyNode('gun-goblin-team', 4, 1)],
    [createBossEnemyNode('beam-cannon-elite', 5, 0)],
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
    id: 'second-start-1',
    type: 'start',
    level: 1,
    label: '入口',
    nextNodeIndices: [],
  }
}

function createEnemyNode(teamId: string, level: number, idx: number): EnemyNode {
  const teamFactory = ENEMY_TEAM_FACTORIES[teamId]
  const team = teamFactory?.()
  const labelName = team?.name ?? teamId
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
