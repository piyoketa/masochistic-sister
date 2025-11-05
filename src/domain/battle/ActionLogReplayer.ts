/**
 * ActionLogReplayer.ts の責務:
 * - ActionLog に記録されたエントリ列を順に適用し、Battle インスタンスと各時点のスナップショットを再構築する。
 * - 直近エントリを UI 向けに解決（resolve）し、敵行動の詳細など派生情報を含む `ResolvedBattleActionLogEntry` を得る。
 *
 * このクラスの責務ではないこと:
 * - ActionLog の正当性検証や補正処理（矛盾は Battle 側で例外として扱う）。
 * - 新しい戦闘操作の生成や保存。既存ログの再生専用ユーティリティである。
 *
 * 主な通信相手とインターフェース:
 * - `Battle`: `createBattle` で生成し、`executeActionLog` により進行、`getSnapshot` や `getLastEnemyTurnSummary` で盤面情報を取得する。
 * - `ActionLog`: `BattleActionLogEntry` を列挙し、`resolveValue` を通じて遅延評価された値を実値に展開する。
 * - `Enemy` / `Card`: `summarizeEnemy`・`summarizeCard` で UI 表示用の簡易サマリへ変換する。同じ「カード」概念でも `CardDefinition` は表示用メタ情報のみ扱う点が異なる。
 */
import type { BattleSnapshot, EnemyTurnActionSummary } from './Battle'
import { ActionLog, type BattleActionLogEntry } from './ActionLog'
import type { Battle } from './Battle'
import type { Enemy } from '../entities/Enemy'
import type { Card } from '../entities/Card'

export interface ActionLogReplayerConfig {
  createBattle: () => Battle
  actionLog: ActionLog
}

export interface ActionLogReplayResult {
  battle: Battle
  snapshot: BattleSnapshot
  initialSnapshot: BattleSnapshot
  lastEntry?: ResolvedBattleActionLogEntry
}

export class ActionLogReplayer {
  private readonly createBattle: () => Battle
  private readonly actionLog: ActionLog

  constructor(config: ActionLogReplayerConfig) {
    this.createBattle = config.createBattle
    this.actionLog = config.actionLog
  }

  run(targetIndex?: number): ActionLogReplayResult {
    const battle = this.createBattle()
    const initialSnapshot = battle.getSnapshot()
    const index = targetIndex ?? this.actionLog.length - 1

    let resolvedEntry: ResolvedBattleActionLogEntry | undefined

    if (index >= 0) {
      battle.executeActionLog(this.actionLog, index)
      const entry = this.actionLog.at(index)
      resolvedEntry = entry ? this.resolveEntry(entry, battle) : undefined
    }

    const snapshot = battle.getSnapshot()
    return {
      battle,
      snapshot,
      initialSnapshot,
      lastEntry: resolvedEntry,
    }
  }

  getActionLog(): ActionLog {
    return this.actionLog
  }

  private resolveEntry(entry: BattleActionLogEntry, battle: Battle): ResolvedBattleActionLogEntry {
    switch (entry.type) {
      case 'battle-start':
        return entry
      case 'start-player-turn':
        return { ...entry }
      case 'play-card':
        return this.resolvePlayCardEntry(entry, battle)
      case 'end-player-turn':
        return this.resolveEndPlayerTurnEntry(battle)
      case 'victory':
      case 'gameover':
        return { type: entry.type }
      default:
        return entry
    }
  }

  private resolvePlayCardEntry(entry: Extract<BattleActionLogEntry, { type: 'play-card' }>, battle: Battle) {
    const cardId = this.actionLog.resolveValue(entry.card, battle)

    const resolved: {
      targetEnemyId?: number
      targetEnemy?: EnemySummary
      selectedHandCardId?: number
      selectedHandCard?: CardSummary
      operations: ResolvedPlayCardOperation[]
    } = {
      operations: [],
    }

    const operations = entry.operations ?? []
    for (const operation of operations) {
      const payload =
        operation.payload === undefined ? undefined : this.actionLog.resolveValue(operation.payload, battle)

      switch (operation.type) {
        case 'target-enemy': {
          const enemyId = this.extractEnemyId(payload)
          const enemy = battle.enemyTeam.findEnemy(enemyId)
          const summary = enemy ? summarizeEnemy(enemy) : undefined
          resolved.targetEnemyId = enemyId
          resolved.targetEnemy = summary
          resolved.operations.push({
            type: 'target-enemy',
            enemyId,
            enemy: summary,
          })
          break
        }
        case 'select-hand-card': {
          const selectedId = this.extractCardId(payload)
          const located = battle.cardRepository.findWithLocation(selectedId)
          const summary = located ? summarizeCard(located.card) : undefined
          resolved.selectedHandCardId = selectedId
          resolved.selectedHandCard = summary
          resolved.operations.push({
            type: 'select-hand-card',
            cardId: selectedId,
            card: summary,
          })
          break
        }
        default: {
          resolved.operations.push({
            type: operation.type,
            payload,
          })
        }
      }
    }

    return {
      type: 'play-card' as const,
      cardId,
      operations: resolved.operations,
      targetEnemyId: resolved.targetEnemyId,
      targetEnemy: resolved.targetEnemy,
      selectedHandCardId: resolved.selectedHandCardId,
      selectedHandCard: resolved.selectedHandCard,
    }
  }

  private resolveEndPlayerTurnEntry(battle: Battle): ResolvedBattleActionLogEntry {
    const summary = battle.getLastEnemyTurnSummary()
    return {
      type: 'end-player-turn',
      enemyActions: summary?.actions ?? [],
    }
  }

  private extractEnemyId(payload: unknown): number {
    if (typeof payload === 'number' && Number.isInteger(payload) && payload >= 0) {
      return payload
    }

    if (typeof payload === 'object' && payload !== null) {
      const candidate =
        (payload as { enemyId?: number }).enemyId ??
        (payload as { targetEnemyId?: number }).targetEnemyId
      if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0) {
        return candidate
      }
    }

    throw new Error('Resolved operation is missing a valid enemy id')
  }

  private extractCardId(payload: unknown): number {
    if (typeof payload === 'number' && Number.isInteger(payload) && payload >= 0) {
      return payload
    }

    if (typeof payload === 'object' && payload !== null) {
      const candidate =
        (payload as { cardId?: number }).cardId ??
        (payload as { selectedHandCardId?: number }).selectedHandCardId
      if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0) {
        return candidate
      }
    }

    throw new Error('Resolved operation is missing a valid card id')
  }
}

export type ResolvedBattleActionLogEntry =
  | { type: 'battle-start' }
  | { type: 'start-player-turn'; draw?: number; handOverflow?: boolean }
  | {
      type: 'play-card'
      cardId: number
      operations: ResolvedPlayCardOperation[]
      targetEnemyId?: number
      targetEnemy?: EnemySummary
      selectedHandCardId?: number
      selectedHandCard?: CardSummary
    }
  | { type: 'end-player-turn'; enemyActions: EnemyTurnActionSummary[] }
  | { type: 'victory' }
  | { type: 'gameover' }

export type ResolvedPlayCardOperation =
  | {
      type: 'target-enemy'
      enemyId: number
      enemy?: EnemySummary
    }
  | {
      type: 'select-hand-card'
      cardId: number
      card?: CardSummary
    }
  | {
      type: string
      payload?: unknown
    }

export interface EnemySummary {
  id: number
  name: string
  currentHp: number
  maxHp: number
}

export interface CardSummary {
  id: number
  title: string
  type?: Card['type']
}

function summarizeEnemy(enemy: Enemy): EnemySummary | undefined {
  const id = enemy.id
  if (id === undefined) {
    return undefined
  }

  return {
    id,
    name: enemy.name,
    currentHp: enemy.currentHp,
    maxHp: enemy.maxHp,
  }
}

function summarizeCard(card: Card): CardSummary | undefined {
  const id = card.id
  if (id === undefined) {
    return undefined
  }

  return {
    id,
    title: card.title,
    type: card.type,
  }
}
