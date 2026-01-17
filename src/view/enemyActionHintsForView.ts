/**
 * buildEnemyActionHintsForView.ts の責務:
 * - Battle 実体から行動キューを参照しつつ、表示中のスナップショットから状態/actedフラグを反映した敵行動ヒントを生成する。
 * - フロントの時間軸ずれ（再生中スナップショットと Battle の差）を吸収し、テスト可能な純関数に近い形で提供する。
 *
 * 対象外の責務:
 * - コンポーネントへの描画やスタイル付け。ここではヒントデータの生成に専念する。
 */
import type { Battle, BattleSnapshot, BattleTurn } from '@/domain/battle/Battle'
import type { EnemyActionHint } from '@/types/battle'
import type { Action as BattleAction } from '@/domain/entities/Action'
import type { State } from '@/domain/entities/State'
import { summarizeEnemyAction } from './enemyActions/actionHintBuilders'
import { reviveStatesOrThrow } from './enemyActions/stateReviver'

const DEBUG_ENEMY_HINT =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEBUG_ENEMY_HINT_LOG === 'true') ||
  (typeof process !== 'undefined' && process.env?.VITE_DEBUG_ENEMY_HINT_LOG === 'true')
const DEBUG_ENEMY_PREDICTION =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEBUG_ENEMY_PREDICTION === 'true') ||
  (typeof process !== 'undefined' && process.env?.VITE_DEBUG_ENEMY_PREDICTION === 'true')

export interface EnemyActionHintBuildParams {
  battle: Battle
  snapshot: BattleSnapshot
  // 敵行動中の例外表示: 行動開始時のプレイヤー状態異常を固定したい場合に指定する。
  // UI都合の補正であり、Modelの状態遷移やスナップショットの整合性には影響させない設計判断。
  actingEnemyId?: number | null
  playerStatesAtActionStart?: BattleSnapshot['player']['states']
}

export type EssentialEnemyActionHint = {
  key: string
  action: BattleAction
  attackerStates: State[]
  defenderStates: State[]
  acted: boolean
  targetName?: string
  hint: EnemyActionHint
}

export function buildEnemyActionHintsForView(params: EnemyActionHintBuildParams): Map<number, EssentialEnemyActionHint[]> {
  const { battle, snapshot, actingEnemyId, playerStatesAtActionStart } = params
  const turnPosition: BattleTurn = snapshot.turnPosition ?? battle.turnPosition
  const result = new Map<number, EssentialEnemyActionHint[]>()

  snapshot.enemies.forEach((enemySnapshot) => {
    const essentials = buildEssentialsForEnemy({
      battle,
      enemySnapshot,
      playerSnapshot: snapshot.player,
      turnPosition,
      actingEnemyId,
      playerStatesAtActionStart,
    })
    if (essentials.length === 0) {
      return
    }
    logBuiltEnemyHints(enemySnapshot, turnPosition, essentials.map((entry) => entry.hint))
    result.set(enemySnapshot.id, essentials)
  })

  return result
}

type EnemySnapshot = BattleSnapshot['enemies'][number]

type BuildEssentialParams = {
  battle: Battle
  enemySnapshot: EnemySnapshot
  playerSnapshot: BattleSnapshot['player']
  turnPosition: BattleTurn
  actingEnemyId?: number | null
  playerStatesAtActionStart?: BattleSnapshot['player']['states']
}

function buildEssentialsForEnemy(params: BuildEssentialParams): EssentialEnemyActionHint[] {
  const { battle, enemySnapshot, playerSnapshot, turnPosition, actingEnemyId, playerStatesAtActionStart } = params
  const enemy = battle.enemyTeam.findEnemy(enemySnapshot.id)
  if (!enemy) {
    return []
  }
  const nextAction = enemy.confirmActionForTurn(turnPosition.turn)
  if (!nextAction) {
    return []
  }

  const plannedPlan = enemySnapshot.plannedActions?.find((entry) => entry.turn === turnPosition.turn)?.plan
  // ターン側に関わらず「今ターン既に行動した」状態を表示側へ伝える。
  const actedThisTurn = enemySnapshot.hasActedThisTurn
  const attackerStates = reviveStatesOrThrow(enemySnapshot.states, `enemy:${enemy.id ?? enemy.name}`)
  // 例外規定: 行動中の敵だけ、行動開始時の状態異常で予測する。
  const shouldUseActionStartStates =
    actingEnemyId !== null && actingEnemyId !== undefined && actingEnemyId === enemySnapshot.id
  const defenderStateSnapshots =
    shouldUseActionStartStates && playerStatesAtActionStart
      ? playerStatesAtActionStart
      : playerSnapshot?.states
  logPredictionOverride({
    enemyId: enemySnapshot.id,
    shouldUseActionStartStates,
    defenderStateSnapshots,
  })
  const defenderStates = reviveStatesOrThrow(defenderStateSnapshots, 'player')
  const hint = summarizeEnemyAction({
    battle,
    enemy,
    action: nextAction,
    enemyStates: attackerStates,
    playerStates: defenderStates,
    plannedPlan,
  })

  return [
    {
      key: `enemy-${enemySnapshot.id}-action-0`,
      action: nextAction,
      attackerStates,
      defenderStates,
      acted: actedThisTurn,
      targetName: hint.targetName,
      hint,
    },
  ]
}

function logPredictionOverride(params: {
  enemyId: number
  shouldUseActionStartStates: boolean
  defenderStateSnapshots: BattleSnapshot['player']['states'] | undefined
}): void {
  if (!DEBUG_ENEMY_PREDICTION || !params.shouldUseActionStartStates) {
    return
  }
  const stateSummary =
    params.defenderStateSnapshots?.map((state) => ({ id: state.id, magnitude: state.magnitude })) ?? []
  // eslint-disable-next-line no-console
  console.info('[EnemyActionHintsForView] override player states', {
    enemyId: params.enemyId,
    states: stateSummary,
  })
}

function logBuiltEnemyHints(
  enemySnapshot: EnemySnapshot,
  turnPosition: BattleTurn,
  hints: EnemyActionHint[],
): void {
  if (!DEBUG_ENEMY_HINT) {
    return
  }
  // eslint-disable-next-line no-console
  console.info('[EnemyActionHintsForView] built', {
    enemy: { id: enemySnapshot.id, name: enemySnapshot.name },
    turn: turnPosition.turn,
    side: turnPosition.side,
    actedThisTurn: enemySnapshot.hasActedThisTurn,
    hints,
  })
}
export { formatEnemyActionChipsForView } from './enemyActionChipFormatter'
