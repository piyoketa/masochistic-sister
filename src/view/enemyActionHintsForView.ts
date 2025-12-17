/**
 * buildEnemyActionHintsForView.ts の責務:
 * - Battle 実体から行動キューを参照しつつ、表示中のスナップショットから状態/actedフラグを反映した敵行動ヒントを生成する。
 * - フロントの時間軸ずれ（再生中スナップショットと Battle の差）を吸収し、テスト可能な純関数に近い形で提供する。
 *
 * 対象外の責務:
 * - コンポーネントへの描画やスタイル付け。ここではヒントデータの生成に専念する。
 */
import type { Battle, BattleSnapshot, BattleTurn } from '@/domain/battle/Battle'
import type { EnemyActionHint, StateSnapshot } from '@/types/battle'
import type { EnemyActionChipSegment, EnemyActionChipViewModel } from '@/types/enemyActionChip'
import type { Enemy } from '@/domain/entities/Enemy'
import { Attack, Action as BattleAction, AllyBuffSkill } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import { Card } from '@/domain/entities/Card'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import { buildCardInfoFromBlueprint, mapActionToCardId } from '@/domain/library/Library'
import type { State } from '@/domain/entities/State'
import { instantiateStateFromSnapshot } from '@/domain/entities/states'

const DEBUG_ENEMY_HINT =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEBUG_ENEMY_HINT_LOG === 'true') ||
  (typeof process !== 'undefined' && process.env?.VITE_DEBUG_ENEMY_HINT_LOG === 'true')

export interface EnemyActionHintBuildParams {
  battle: Battle
  snapshot: BattleSnapshot
  cache?: Map<number, EnemyActionHint[]>
}

export type EssentialEnemyActionHint = {
  key: string
  action: BattleAction
  attackerStates: State[]
  defenderStates: State[]
  acted: boolean
  // targetName?: string
  // hint: EnemyActionHint
}

export function buildEnemyActionHintsForView(params: EnemyActionHintBuildParams): Map<number, EssentialEnemyActionHint[]> {
  const { battle, snapshot, cache } = params
  const turnPosition: BattleTurn = snapshot.turnPosition ?? battle.turnPosition
  const result = new Map<number, EssentialEnemyActionHint[]>()

  snapshot.enemies.forEach((enemySnapshot) => {
    const enemy = battle.enemyTeam.findEnemy(enemySnapshot.id)
    if (!enemy) {
      return
    }
    const actedThisTurn = snapshot.turnPosition?.side === 'enemy' && enemySnapshot.hasActedThisTurn

    const hints = buildEnemyActionHintsInternal({
      battle,
      enemy,
      turnPosition,
      enemyStateSnapshots: enemySnapshot.states,
      playerStateSnapshots: snapshot.player?.states,
    }).map((hint) => ({ ...hint, acted: actedThisTurn }))

    const essentials = hints.map((hint, index) => ({
      key: `enemy-${enemySnapshot.id}-action-${index}`,
      action: enemy.confirmActionForTurn(turnPosition.turn)!,
      attackerStates: reviveStates(enemySnapshot.states, `enemy:${enemy.id ?? enemy.name}`),
      defenderStates: reviveStates(snapshot.player?.states, 'player'),
      acted: actedThisTurn,
      targetName: hint.targetName,
      hint,
    }))

    if (DEBUG_ENEMY_HINT) {
      // eslint-disable-next-line no-console
      console.info('[EnemyActionHintsForView] built', {
        enemy: { id: enemySnapshot.id, name: enemySnapshot.name },
        turn: turnPosition.turn,
        side: turnPosition.activeSide,
        actedThisTurn,
        hints,
      })
    }

    result.set(enemySnapshot.id, essentials)
  })

  return result
}

// 以下は元 enemyActionHintBuilder.ts の実装を集約したもの。
type EnemyActionHintParams = {
  battle: Battle
  enemy: Enemy
  turnPosition: BattleTurn
  enemyStateSnapshots?: StateSnapshot[]
  playerStateSnapshots?: StateSnapshot[]
}

function buildEnemyActionHintsInternal(params: EnemyActionHintParams): EnemyActionHint[] {
  const { battle, enemy, turnPosition, enemyStateSnapshots, playerStateSnapshots } = params
  const nextAction = enemy.confirmActionForTurn(turnPosition.turn)
  if (!nextAction) {
    return []
  }
  const hint = summarizeEnemyAction({
    battle,
    enemy,
    action: nextAction,
    enemyStates: reviveStates(enemyStateSnapshots, `enemy:${enemy.id ?? enemy.name}`),
    playerStates: reviveStates(playerStateSnapshots, 'player'),
  })
  const acted = enemy.hasActedThisTurn
  return [
    {
      ...hint,
      acted,
    },
  ]
}

function summarizeEnemyAction({
  battle,
  enemy,
  action,
  enemyStates,
  playerStates,
}: {
  battle: Battle
  enemy: Enemy
  action: BattleAction
  enemyStates: State[]
  playerStates: State[]
}): EnemyActionHint {
  if (action instanceof SkipTurnAction) {
    return {
      title: action.name,
      type: 'skip',
      icon: '',
      description: action.describe(),
    }
  }

  if (action instanceof Attack) {
    return buildAttackActionHint({ enemy, action, enemyStates, playerStates })
  }

  return buildSkillActionHint(battle, action)
}

function buildAttackActionHint({
  enemy,
  action,
  enemyStates,
  playerStates,
}: {
  enemy: Enemy
  action: Attack
  enemyStates: State[]
  playerStates: State[]
}): EnemyActionHint {
  const damages = action.baseDamages
  const states = action.inflictStatePreviews
  const primaryState = states[0]
  const cardId = mapActionToCardId(action)

  const calculatedDamages = new Damages({
    baseAmount: damages.baseAmount,
    baseCount: damages.baseCount,
    type: damages.type,
    cardId: cardId ?? action.getCardId(),
    attackerStates: enemyStates,
    defenderStates: playerStates,
  })

  const calculatedPattern = {
    amount: calculatedDamages.amount,
    count: calculatedDamages.count,
    type: calculatedDamages.type,
  }
  const primaryStateStackable =
    primaryState && typeof primaryState.isStackable === 'function' ? primaryState.isStackable() : false

  const blueprint =
    cardId !== null
      ? {
          type: cardId,
          overrideAmount: calculatedPattern.amount,
          overrideCount: calculatedPattern.count,
        }
      : null

  return {
    title: action.name,
    type: 'attack',
    cardId: cardId ?? undefined,
    icon: '',
    pattern: {
      amount: damages.baseAmount,
      count: damages.baseCount,
      type: damages.type,
    },
    calculatedPattern,
    status: primaryState
      ? {
          name: primaryState.name,
          stackable: primaryStateStackable,
          magnitude: primaryStateStackable ? primaryState.magnitude ?? 0 : undefined,
          description: primaryState.description(),
          iconPath: primaryState.iconPath,
        }
      : undefined,
    description: action.describe(),
    cardInfo:
      (blueprint ? buildCardInfoFromBlueprint(blueprint, `enemy-action-${enemy.id}`) : null) ??
      (buildCardInfoFromCard(new Card({ action }), {
        id: `enemy-action-${enemy.id}-${action.name}`,
        affordable: true,
        disabled: false,
      }) ?? undefined),
  }
}

function buildSkillActionHint(battle: Battle, action: BattleAction): EnemyActionHint {
  const gainState = action.gainStatePreviews[0]
  const inflictState =
    'inflictStatePreviews' in action
      ? ((action as any).inflictStatePreviews?.[0] as import('@/domain/entities/State').State | undefined)
      : undefined
  let targetName: string | undefined
  if (action instanceof AllyBuffSkill) {
    const plannedTargetId = action.getPlannedTarget?.()
    if (plannedTargetId !== undefined) {
      const target = battle.enemyTeam.findEnemy(plannedTargetId)
      targetName = target?.name
    }
  }

  return {
    title: action.name,
    type: action.type,
    icon: '',
    description: action.describe(),
    targetName,
    selfState: gainState
      ? {
          name: gainState.name,
          stackable: typeof gainState.isStackable === 'function' ? gainState.isStackable() : false,
          magnitude:
            typeof gainState.isStackable === 'function' && gainState.isStackable()
              ? gainState.magnitude ?? 0
              : undefined,
          description: gainState.description(),
          iconPath: gainState.iconPath,
        }
      : undefined,
    status: inflictState
      ? {
          name: inflictState.name,
          stackable: typeof inflictState.isStackable === 'function' ? inflictState.isStackable() : false,
          magnitude:
            typeof inflictState.isStackable === 'function' && inflictState.isStackable()
              ? inflictState.magnitude ?? 0
              : undefined,
          description: inflictState.description(),
          iconPath: inflictState.iconPath,
        }
      : undefined,
  }
}

function reviveStates(snapshots: StateSnapshot[] | undefined, contextLabel: string): State[] {
  if (!snapshots) {
    throw new Error(`[EnemyActionHint] State snapshots missing for ${contextLabel}`)
  }
  const revived = snapshots
    .map((snapshot) => instantiateStateFromSnapshot(snapshot))
    .filter((state): state is State => Boolean(state))
  if (snapshots.length > 0 && revived.length === 0) {
    const snapshotIds = snapshots.map((s) => s.id ?? 'undefined').join(', ')
    // デバッグ用: どのスナップショットが復元できなかったかを明示しておく
    // eslint-disable-next-line no-console
    console.error('[EnemyActionHint] reviveStates failed', { contextLabel, snapshots })
    throw new Error(
      `[EnemyActionHint] No states could be revived from snapshots for ${contextLabel}. ids=[${snapshotIds}]`,
    )
  }
  return revived
}

/**
 * EnemyActionHint をビュー表示用のチップViewModelへ整形する。
 * アイコンやツールチップ、ActionCardOverlay表示フラグもここで決定する。
 */
export function formatEnemyActionChipsForView(
  enemyId: number,
  essentials: EssentialEnemyActionHint[],
  options: { includeTitle?: boolean } = {},
): EnemyActionChipViewModel[] {
  const includeTitle = options.includeTitle ?? false
  return essentials.map((essential, index) => {
    const hint = essential.hint
    const segments: EnemyActionChipSegment[] = []
    const appendTarget = () => {
      if (!essential.targetName) return
      segments.push({ text: `→ ${essential.targetName}` })
    }

    if (hint.type === 'skip') {
      segments.push({ text: '行動不可', iconPath: '/assets/icons/skip.png' })
      return {
        key: essential.key,
        segments,
        label: '行動不可',
        disabled: Boolean(essential.acted),
      }
    }

    if (hint.type === 'attack') {
      const pattern = hint.pattern
      const calculatedPattern = hint.calculatedPattern ?? pattern
      const baseAmount = pattern?.amount !== undefined ? Math.floor(pattern.amount) : undefined
      const baseCount = pattern?.count !== undefined ? Math.floor(pattern.count) : undefined
      const amount = Math.max(0, Math.floor(calculatedPattern?.amount ?? pattern?.amount ?? 0))
      const count = Math.max(1, Math.floor(calculatedPattern?.count ?? pattern?.count ?? 1))
      const attackPattern = calculatedPattern?.type ?? pattern?.type ?? 'single'
      const isMulti = attackPattern === 'multi'

      if (includeTitle && hint.title) {
        segments.push({ text: `${hint.title}: `, showOverlay: true })
      }

      const amountChanged = baseAmount !== undefined && amount !== baseAmount
      const amountChange: 'up' | 'down' | undefined =
        amountChanged && baseAmount !== undefined ? (amount > baseAmount ? 'up' : 'down') : undefined
      segments.push({
        text: isMulti ? '⚔️' : '💥',
        showOverlay: true,
      })
      segments.push({
        text: `${amount}`,
        highlighted: amountChanged,
        change: amountChange,
        showOverlay: true,
      })

      if (isMulti) {
        const countChanged = baseCount !== undefined && count !== baseCount
        const countChange: 'up' | 'down' | undefined =
          countChanged && baseCount !== undefined ? (count > baseCount ? 'up' : 'down') : undefined
        segments.push({
          text: `×${count}`,
          highlighted: countChanged,
          change: countChange,
          showOverlay: true,
        })
      }

      const status = hint.status
      if (status) {
        segments.push({ text: '+' })
        segments.push({
          text: status.name,
          iconPath: status.iconPath,
          tooltip: status.description,
          showOverlay: true,
        })
      }

      appendTarget()

      return {
        key: essential.key,
        segments,
        label: segments.map((s) => s.text).join(''),
        disabled: Boolean(essential.acted),
        cardInfo: hint.cardInfo,
      }
    }

    // skill
    const state = hint.selfState ?? hint.status
    if (state) {
      if (includeTitle) {
        segments.push({ text: `${hint.title}：` })
      }
      segments.push({
        text: state.name,
        iconPath: state.iconPath,
        tooltip: state.description,
      })
      appendTarget()
      return {
        key: essential.key,
        segments,
        label: segments.map((s) => s.text).join(''),
        disabled: Boolean(essential.acted),
        cardInfo: hint.cardInfo,
      }
    }

    if (includeTitle && hint.description) {
      segments.push({ text: hint.title })
      segments.push({ text: '✨' })
      appendTarget()
      return {
        key: essential.key,
        segments,
        label: segments.map((s) => s.text).join(''),
        disabled: Boolean(essential.acted),
        cardInfo: hint.cardInfo,
      }
    }

    if (includeTitle && hint.title) {
      segments.push({ text: hint.title })
    }
    segments.push({ text: '✨' })
    appendTarget()
    return {
      key: essential.key,
      segments,
      label: segments.map((s) => s.text).join(''),
      disabled: Boolean(essential.acted),
      cardInfo: hint.cardInfo,
    }
  })
}
