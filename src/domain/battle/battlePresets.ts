import { Battle } from './Battle'
import { Deck } from './Deck'
import { Hand } from './Hand'
import { DiscardPile } from './DiscardPile'
import { ExilePile } from './ExilePile'
import { BattleEventQueue } from './BattleEvent'
import { BattleLog } from './BattleLog'
import { TurnManager } from './TurnManager'
import { CardRepository } from '../repository/CardRepository'
import { ProtagonistPlayer } from '../entities/players'
import { Card } from '../entities/Card'
import {
  buildDefaultDeck,
  buildTestDeck,
  buildScenario2Deck,
  buildDefaultDeck2,
  buildTutorialDeck,
} from '../entities/decks'
import {
  SnailTeam,
  TestEnemyTeam,
  IronBloomTeam,
  HummingbirdAlliesTeam,
  OrcHeroEliteTeam,
  TutorialEnemyTeam,
  TestOrcWrestlerTeam,
} from '../entities/enemyTeams'
import type { EnemyTeam } from '../entities/EnemyTeam'
import { MasochisticAuraAction } from '../entities/actions/MasochisticAuraAction'
import { BattlePrepAction } from '../entities/actions/BattlePrepAction'
import { HeavenChainAction } from '../entities/actions/HeavenChainAction'

interface DeckBuilderResult {
  deck: Card[]
}

interface BattlePreset {
  id: string
  deckBuilder: (repository: CardRepository) => DeckBuilderResult
  enemyTeamFactory: () => EnemyTeam
}

function createBattleFromPreset(preset: BattlePreset): Battle {
  const cardRepository = new CardRepository()
  const deckResult = preset.deckBuilder(cardRepository)
  const player = new ProtagonistPlayer()
  const enemyTeam = preset.enemyTeamFactory()

  return new Battle({
    id: preset.id,
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
    relicClassNames: [],
  })
}

export function createDefaultSnailBattle(): Battle {
  return createBattleFromPreset({
    id: 'battle-snail-encounter',
    deckBuilder: buildDefaultDeck,
    enemyTeamFactory: () => new SnailTeam(),
  })
}

export function createTestCaseBattle(): Battle {
  return createBattleFromPreset({
    id: 'battle-testcase1',
    deckBuilder: buildTestDeck,
    enemyTeamFactory: () => new TestEnemyTeam(),
  })
}

export function createTestCaseBattle2(): Battle {
  return createBattleFromPreset({
    id: 'battle-testcase2',
    deckBuilder: buildScenario2Deck,
    enemyTeamFactory: () => new IronBloomTeam(),
  })
}

export function createStage2Battle(): Battle {
  return createBattleFromPreset({
    id: 'battle-stage2',
    deckBuilder: buildDefaultDeck2,
    enemyTeamFactory: () => new IronBloomTeam({ mode: 'random' }),
  })
}

export function createStage3Battle(): Battle {
  return createBattleFromPreset({
    id: 'battle-stage3',
    deckBuilder: buildDefaultDeck,
    enemyTeamFactory: () => new HummingbirdAlliesTeam(),
  })
}

export function createStage4Battle(): Battle {
  return createBattleFromPreset({
    id: 'battle-stage4',
    deckBuilder: buildDefaultDeck,
    enemyTeamFactory: () => new OrcHeroEliteTeam(),
  })
}

export function createTutorialBattle(): Battle {
  return createBattleFromPreset({
    id: 'battle-tutorial',
    deckBuilder: buildTutorialDeck,
    enemyTeamFactory: () => new TutorialEnemyTeam(),
  })
}

export function createTestCaseBattle3(): Battle {
  const cardRepository = new CardRepository()
  const createCard = <T extends Card>(factory: () => T) => cardRepository.create(factory)
  const deck: Card[] = [
    createCard(() => new Card({ action: new MasochisticAuraAction() })),
    createCard(() => new Card({ action: new BattlePrepAction() })),
    createCard(() => new Card({ action: new HeavenChainAction() })),
    createCard(() => new Card({ action: new HeavenChainAction() })),
    createCard(() => new Card({ action: new HeavenChainAction() })),
    createCard(() => new Card({ action: new HeavenChainAction() })),
  ]
  const hand: Card[] = []

  return new Battle({
    id: 'battle-testcase3',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam: new TestOrcWrestlerTeam(),
    deck: new Deck(deck),
    hand: new Hand(hand),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
    relicClassNames: ['SacrificialAwarenessRelic'],
  })
}
