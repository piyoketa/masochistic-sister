import { ActionLog } from '@/domain/battle/ActionLog'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import { Battle } from '@/domain/battle/Battle'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { Deck } from '@/domain/battle/Deck'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { Hand } from '@/domain/battle/Hand'
import { ActionLogReplayer } from '@/domain/battle/ActionLogReplayer'
import { TurnManager } from '@/domain/battle/TurnManager'
import { Card } from '@/domain/entities/Card'
import { buildDefaultDeck } from '@/domain/entities/decks'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { OrcEnemy, OrcDancerEnemy, TentacleEnemy, SnailEnemy } from '@/domain/entities/enemies'
import { AcidSpitAction } from '@/domain/entities/actions/AcidSpitAction'
import { BattleDanceAction } from '@/domain/entities/actions/BattleDanceAction'
import { MucusShotAction } from '@/domain/entities/actions/MucusShotAction'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { CardRepository } from '@/domain/repository/CardRepository'
import { CorrosionState } from '@/domain/entities/states/CorrosionState'
import { AccelerationState } from '@/domain/entities/states/AccelerationState'
import { StickyState } from '@/domain/entities/states/StickyState'
import { StrengthState } from '@/domain/entities/states/StrengthState'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'

export type ScenarioSteps = Record<string, number>

export interface ScenarioReferences {
  masochisticAuraId: number
  heavenChainIds: [number, number, number, number, number]
  battlePrepIds: [number, number]
  enemyIds: {
    orc: number
    orcDancer: number
    tentacle: number
    snail: number
  }
}

export interface BattleScenario {
  createBattle: () => Battle
  replayer: ActionLogReplayer
  steps: ScenarioSteps
  references: ScenarioReferences
}

export type ThirdTurnBuilder = (args: {
  actionLog: ActionLog
  references: ScenarioReferences
}) => Record<string, number>

export function requireCardId(card: Card | undefined): number {
  if (!card || card.numericId === undefined) {
    throw new Error('Card missing repository id')
  }

  return card.numericId
}

const isMemoryCardWithTitle = (card: Card, title: string): boolean =>
  card.title === title && (card.cardTags ?? []).some((tag) => tag.id === 'tag-memory')

export function createBaseBattle(): Battle {
  const cardRepository = new CardRepository()
  const defaultDeck = buildDefaultDeck(cardRepository)
  const player = new ProtagonistPlayer()
  const enemyTeam = new EnemyTeam({
    id: 'enemy-team-snail-encounter',
    members: [
      new OrcEnemy({ rng: () => 0.05 }),
      new OrcDancerEnemy({ rng: () => 0.85 }),
      new TentacleEnemy({ rng: () => 0.85 }),
      new SnailEnemy({ rng: () => 0.95 }),
    ],
  })

  return new Battle({
    id: 'battle-1',
    cardRepository,
    player,
    enemyTeam,
    deck: new Deck(defaultDeck.deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

export function collectScenarioReferences(snapshot: BattleSnapshot): ScenarioReferences {
  const collectCardIdsByTitle = (title: string): number[] =>
    snapshot.deck.filter((card) => card.title === title).map((card) => requireCardId(card))

  const heavenChainIds = collectCardIdsByTitle('天の鎖')
  const battlePrepIds = collectCardIdsByTitle('戦いの準備')

  if (heavenChainIds.length < 5) {
    throw new Error('デフォルトデッキに天の鎖が5枚未満です')
  }
  if (battlePrepIds.length < 2) {
    throw new Error('デフォルトデッキに戦いの準備が2枚未満です')
  }

  const heavenChainTuple = heavenChainIds.slice(0, 5) as [number, number, number, number, number]
  const battlePrepTuple = battlePrepIds.slice(0, 2) as [number, number]

  const masochisticAuraId = requireCardId(
    snapshot.deck.find((card) => card.title === '被虐のオーラ'),
  )

  const findEnemyId = (name: string): number => {
    const enemy = snapshot.enemies.find((candidate) => candidate.name === name)
    if (!enemy) {
      throw new Error(`Enemy ${name} not found in sample snapshot`)
    }

    return enemy.numericId
  }

  return {
    masochisticAuraId,
    heavenChainIds: heavenChainTuple,
    battlePrepIds: battlePrepTuple,
    enemyIds: {
      orc: findEnemyId('オーク'),
      orcDancer: findEnemyId('オークダンサー'),
      tentacle: findEnemyId('触手'),
      snail: findEnemyId('かたつむり'),
    },
  }
}

export function createBattleScenario(thirdTurnBuilder: ThirdTurnBuilder): BattleScenario {
  const createBattle = () => createBaseBattle()
  const sampleSnapshot = createBattle().getSnapshot()
  const references = collectScenarioReferences(sampleSnapshot)
  const actionLog = new ActionLog()

  const steps = {
    battleStart: actionLog.push({ type: 'battle-start' }),
    playerTurn1Start: actionLog.push({ type: 'start-player-turn', draw: 5 }),
    playMasochisticAura: actionLog.push({
      type: 'play-card',
      card: references.masochisticAuraId,
      operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
    }),
    playHeavenChainOnOrc: actionLog.push({
      type: 'play-card',
      card: references.heavenChainIds[0]!,
      operations: [{ type: 'target-enemy', payload: references.enemyIds.orc }],
    }),
    playBattlePrep: actionLog.push({
      type: 'play-card',
      card: references.battlePrepIds[0]!,
    }),
    endPlayerTurn1: actionLog.push({ type: 'end-player-turn' }),
    startEnemyTurn1: actionLog.push({ type: 'start-enemy-turn' }),
    orcActs: actionLog.push({ type: 'enemy-action', enemy: references.enemyIds.orc }),
    orcDancerActs: actionLog.push({ type: 'enemy-action', enemy: references.enemyIds.orcDancer }),
    tentacleActs: actionLog.push({ type: 'enemy-action', enemy: references.enemyIds.tentacle }),
    snailActs: actionLog.push({ type: 'enemy-action', enemy: references.enemyIds.snail }),
    endEnemyTurn1: actionLog.push({ type: 'end-player-turn' }),
    startPlayerTurn2: actionLog.push({ type: 'start-player-turn', draw: 2 }),
    playHeavenChainOnTentacle: actionLog.push({
      type: 'play-card',
      card: references.heavenChainIds[1]!,
      operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
    }),
    playHeavenChainOnSnail: actionLog.push({
      type: 'play-card',
      card: references.heavenChainIds[2]!,
      operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
    }),
    playAcidSpitOnSnail: actionLog.push({
      type: 'play-card',
      card: (battle) => {
        const card = battle.cardRepository.find((candidate) =>
          isMemoryCardWithTitle(candidate, '酸を吐く'),
        )
        if (!card) {
          throw new Error('手札に酸を吐くの記憶カードが存在しません')
        }

        return requireCardId(card)
      },
      operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
    }),
    playStickyState: actionLog.push({
      type: 'play-card',
      card: (battle) => {
        const card = battle.cardRepository.find((candidate) => candidate.title === 'ねばねば')
        if (!card) {
          throw new Error('手札にねばねばの状態カードが存在しません')
        }

        return requireCardId(card)
      },
    }),
    endPlayerTurn2: actionLog.push({ type: 'end-player-turn' }),
    startEnemyTurn2: actionLog.push({ type: 'start-enemy-turn' }),
    orcActsSecond: actionLog.push({ type: 'enemy-action', enemy: references.enemyIds.orc }),
    orcDancerActsSecond: actionLog.push({
      type: 'enemy-action',
      enemy: references.enemyIds.orcDancer,
    }),
    tentacleActsSecond: actionLog.push({
      type: 'enemy-action',
      enemy: references.enemyIds.tentacle,
    }),
    snailActsSecond: actionLog.push({ type: 'enemy-action', enemy: references.enemyIds.snail }),
    endEnemyTurn2: actionLog.push({ type: 'end-player-turn' }),
    startPlayerTurn3: actionLog.push({ type: 'start-player-turn', draw: 2 }),
  } as ScenarioSteps

  const thirdTurnSteps = thirdTurnBuilder({ actionLog, references })
  const combinedSteps: ScenarioSteps = { ...steps, ...thirdTurnSteps }

  return {
    createBattle,
    replayer: new ActionLogReplayer({
      createBattle,
      actionLog,
    }),
    steps: combinedSteps,
    references,
  }
}

export function buildThirdTurnPattern1({
  actionLog,
  references,
}: {
  actionLog: ActionLog
  references: ScenarioReferences
}) {
  const steps: ScenarioSteps = {
    playFlurryOnSnail: actionLog.push({
      type: 'play-card',
      card: (battle) => {
        const card = battle.cardRepository.find((candidate) =>
          isMemoryCardWithTitle(candidate, '乱れ突き'),
        )
        if (!card) {
          throw new Error('手札に乱れ突きの記憶カードが存在しません')
        }
        return requireCardId(card)
      },
      operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
    }),
    endPlayerTurn3: actionLog.push({ type: 'end-player-turn' }),
    startEnemyTurn3: actionLog.push({ type: 'start-enemy-turn' }),
    orcActsThird: actionLog.push({ type: 'enemy-action', enemy: references.enemyIds.orc }),
  }

  return steps
}

export function buildThirdTurnPattern2({
  actionLog,
  references,
}: {
  actionLog: ActionLog
  references: ScenarioReferences
}) {
  const steps: ScenarioSteps = {
    playFlurryOnOrc: actionLog.push({
      type: 'play-card',
      card: (battle) => {
        const card = battle.cardRepository.find((candidate) =>
          isMemoryCardWithTitle(candidate, '乱れ突き'),
        )
        if (!card) {
          throw new Error('手札に乱れ突きの記憶カードが存在しません')
        }
        return requireCardId(card)
      },
      operations: [{ type: 'target-enemy', payload: references.enemyIds.orc }],
    }),
    playMucusShotOnOrcDancer: actionLog.push({
      type: 'play-card',
      card: (battle) => {
        const card = battle.cardRepository.find(
          (candidate) => isMemoryCardWithTitle(candidate, '粘液飛ばし'),
        )
        if (!card) {
          throw new Error('手札に粘液飛ばしの記憶カードが存在しません')
        }
        return requireCardId(card)
      },
      operations: [{ type: 'target-enemy', payload: references.enemyIds.orcDancer }],
    }),
    playHeavenChainOnTentacleTurn3: actionLog.push({
      type: 'play-card',
      card: references.heavenChainIds[4]!,
      operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
    }),
    endPlayerTurn3Pattern2: actionLog.push({ type: 'end-player-turn' }),
    startEnemyTurn3Pattern2: actionLog.push({ type: 'start-enemy-turn' }),
    orcDancerActsThirdAlt: actionLog.push({
      type: 'enemy-action',
      enemy: references.enemyIds.orcDancer,
    }),
    tentacleActsThirdAlt: actionLog.push({
      type: 'enemy-action',
      enemy: references.enemyIds.tentacle,
    }),
    snailActsThirdAlt: actionLog.push({
      type: 'enemy-action',
      enemy: references.enemyIds.snail,
    }),
  }

  return steps
}

export function createBattleSampleScenario(): BattleScenario {
  return createBattleScenario(buildThirdTurnPattern1)
}

export function createBattleSampleScenarioPattern2(): BattleScenario {
  return createBattleScenario(buildThirdTurnPattern2)
}

export function createBattleSampleScenarioPattern3(): BattleScenario {
  const createBattle = () => createBaseBattle()
  const sampleSnapshot = createBattle().getSnapshot()
  const references = collectScenarioReferences(sampleSnapshot)
  const actionLog = new ActionLog()

  const steps: ScenarioSteps = {
    battleStart: actionLog.push({ type: 'battle-start' }),
    playerTurn1Start: actionLog.push({ type: 'start-player-turn', draw: 5 }),
    playMasochisticAura: actionLog.push({
      type: 'play-card',
      card: references.masochisticAuraId,
      operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
    }),
    playCorrosionState: actionLog.push({
      type: 'play-card',
      card: (battle) => {
        const card = battle.cardRepository.find((candidate) => candidate.title === '腐食')
        if (!card) {
          throw new Error('手札に腐食状態カードが存在しません')
        }
        return requireCardId(card)
      },
    }),
  }

  return {
    createBattle,
    replayer: new ActionLogReplayer({
      createBattle,
      actionLog,
    }),
    steps,
    references,
  }
}


export {
  AcidSpitAction,
  BattleDanceAction,
  MucusShotAction,
  TackleAction,
  FlurryAction,
  CorrosionState,
  AccelerationState,
  StickyState,
  StrengthState,
  SkipTurnAction,
}
