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
import type { Card } from '../entities/Card'
import {
  buildDefaultDeck,
  buildTestDeck,
  buildScenario2Deck,
  buildDefaultDeck2,
} from '../entities/decks'
import { SnailTeam, TestEnemyTeam, IronBloomTeam } from '../entities/enemyTeams'
import type { EnemyTeam } from '../entities/EnemyTeam'

interface DeckBuilderResult {
  deck: Card[]
  [key: string]: unknown
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
