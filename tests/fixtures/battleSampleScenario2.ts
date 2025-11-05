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
import { buildScenario2Deck } from '@/domain/entities/decks'
import { IronBloomTeam } from '@/domain/entities/enemyTeams'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { CardRepository } from '@/domain/repository/CardRepository'
import { TailwindAction } from '@/domain/entities/actions/TailwindAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { MucusShotAction } from '@/domain/entities/actions/MucusShotAction'
import { AcidSpitAction } from '@/domain/entities/actions/AcidSpitAction'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { MasochisticAuraAction } from '@/domain/entities/actions/MasochisticAuraAction'
import { DailyRoutineAction } from '@/domain/entities/actions/DailyRoutineAction'
import { ReloadAction } from '@/domain/entities/actions/ReloadAction'
import { CorrosionState } from '@/domain/entities/states/CorrosionState'
import { StickyState } from '@/domain/entities/states/StickyState'

export interface Scenario2Steps {
  battleStart: number
  playerTurn1Start: number
  playMasochisticAuraOnIronBloom: number
  playHeavenChainOnSlug: number
  playBattlePrep: number
  endPlayerTurn1: number
  playerTurn2Start: number
  playFlurryOnIronBloom: number
  playMasochisticAuraOnOrcLancer: number
  playFlurryOnOrcLancer: number
  playDailyRoutine: number
  endPlayerTurn2: number
  playerTurn3Start: number
  playReload: number
  playFlurryOnKamaitachi: number
  victory: number
}

export interface Scenario2References {
  heavenChainIds: readonly [number, number, number, number]
  masochisticAuraIds: readonly [number, number]
  battlePrepId: number
  dailyRoutineId: number
  reloadId: number
  enemyIds: {
    orcLancer: number
    kamaitachi: number
    ironBloom: number
    slug: number
  }
}

export interface BattleScenario2 {
  createBattle: () => Battle
  replayer: ActionLogReplayer
  steps: Scenario2Steps
  references: Scenario2References
}

export function requireCardId(card: Card | undefined): number {
  if (!card || card.id === undefined) {
    throw new Error('Card missing repository id')
  }
  return card.id
}

function createScenario2Battle(): Battle {
  const cardRepository = new CardRepository()
  const deckResult = buildScenario2Deck(cardRepository)

  const player = new ProtagonistPlayer()
  const enemyTeam = new IronBloomTeam()

  return new Battle({
    id: 'battle-scenario-2',
    cardRepository,
    player,
    enemyTeam,
    deck: new Deck(deckResult.deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

function collectScenario2References(snapshot: BattleSnapshot): Scenario2References {
  const collectCardIdsByTitle = (title: string): number[] =>
    snapshot.deck.filter((card) => card.title === title).map((card) => requireCardId(card))

  const heavenChains = collectCardIdsByTitle('天の鎖')
  const masochisticAuras = collectCardIdsByTitle('被虐のオーラ')

  if (heavenChains.length < 4) {
    throw new Error('シナリオ2デッキに天の鎖が4枚ありません')
  }
  if (masochisticAuras.length < 2) {
    throw new Error('シナリオ2デッキに被虐のオーラが2枚ありません')
  }

  const findCardId = (title: string): number => {
    const card = snapshot.deck.find((candidate) => candidate.title === title)
    if (!card) {
      throw new Error(`カード ${title} がデッキに見つかりません`)
    }
    return requireCardId(card)
  }

  const findEnemyId = (name: string): number => {
    const enemy = snapshot.enemies.find((candidate) => candidate.name === name)
    if (!enemy) {
      throw new Error(`Enemy ${name} not found in scenario snapshot`)
    }
    return enemy.id
  }

  return {
    heavenChainIds: heavenChains.slice(0, 4) as [number, number, number, number],
    masochisticAuraIds: masochisticAuras.slice(0, 2) as [number, number],
    battlePrepId: findCardId('戦いの準備'),
    dailyRoutineId: findCardId('日課'),
    reloadId: findCardId('再装填'),
    enemyIds: {
      orcLancer: findEnemyId('オークランサー'),
      kamaitachi: findEnemyId('かまいたち'),
      ironBloom: findEnemyId('鉄花'),
      slug: findEnemyId('なめくじ'),
    },
  }
}

function findMemoryCardId(battle: Battle, title: string): number {
  const inHand = battle.hand
    .list()
    .find(
      (card) =>
        card.title === title &&
        (card.cardTags ?? []).some((tag) => tag.id === 'tag-memory'),
    )

  if (inHand) {
    return requireCardId(inHand)
  }

  const fallback = battle.cardRepository.find(
    (card) =>
      card.title === title && (card.cardTags ?? []).some((tag) => tag.id === 'tag-memory'),
  )

  if (!fallback) {
    throw new Error(`${title} の記憶カードが見つかりません`)
  }

  return requireCardId(fallback)
}

export function createBattleScenario2(): BattleScenario2 {
  const createBattle = () => createScenario2Battle()
  const sampleSnapshot = createBattle().getSnapshot()
  const references = collectScenario2References(sampleSnapshot)

  const actionLog = new ActionLog()

  const steps: Scenario2Steps = {
    battleStart: actionLog.push({ type: 'battle-start' }),
    playerTurn1Start: actionLog.push({ type: 'start-player-turn', draw: 5 }),
    playMasochisticAuraOnIronBloom: actionLog.push({
      type: 'play-card',
      card: references.masochisticAuraIds[0],
      operations: [{ type: 'target-enemy', payload: references.enemyIds.ironBloom }],
    }),
    playHeavenChainOnSlug: actionLog.push({
      type: 'play-card',
      card: references.heavenChainIds[0],
      operations: [{ type: 'target-enemy', payload: references.enemyIds.slug }],
    }),
    playBattlePrep: actionLog.push({
      type: 'play-card',
      card: references.battlePrepId,
    }),
    endPlayerTurn1: actionLog.push({ type: 'end-player-turn' }),
    playerTurn2Start: actionLog.push({ type: 'start-player-turn', draw: 2 }),
    playFlurryOnIronBloom: actionLog.push({
      type: 'play-card',
      card: (battle) => findMemoryCardId(battle, '乱れ突き'),
      operations: [{ type: 'target-enemy', payload: references.enemyIds.ironBloom }],
    }),
    playMasochisticAuraOnOrcLancer: actionLog.push({
      type: 'play-card',
      card: references.masochisticAuraIds[1],
      operations: [{ type: 'target-enemy', payload: references.enemyIds.orcLancer }],
    }),
    playFlurryOnOrcLancer: actionLog.push({
      type: 'play-card',
      card: (battle) => findMemoryCardId(battle, '乱れ突き'),
      operations: [{ type: 'target-enemy', payload: references.enemyIds.orcLancer }],
    }),
    playDailyRoutine: actionLog.push({
      type: 'play-card',
      card: references.dailyRoutineId,
    }),
    endPlayerTurn2: actionLog.push({ type: 'end-player-turn' }),
    playerTurn3Start: actionLog.push({ type: 'start-player-turn', draw: 2 }),
    playReload: actionLog.push({
      type: 'play-card',
      card: references.reloadId,
    }),
    playFlurryOnKamaitachi: actionLog.push({
      type: 'play-card',
      card: (battle) => findMemoryCardId(battle, '乱れ突き'),
      operations: [{ type: 'target-enemy', payload: references.enemyIds.kamaitachi }],
    }),
    victory: actionLog.push({ type: 'victory' }),
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
  TailwindAction,
  FlurryAction,
  MucusShotAction,
  AcidSpitAction,
  HeavenChainAction,
  MasochisticAuraAction,
  DailyRoutineAction,
  ReloadAction,
  CorrosionState,
  StickyState,
}
