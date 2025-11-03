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
import { buildDefaultDeck, buildTestDeck } from '../entities/decks'
import { SnailTeam, TestEnemyTeam } from '../entities/enemyTeams'
import type { EnemyTeam } from '../entities/EnemyTeam'

interface BattlePreset {
  id: string
  deckBuilder: (repository: CardRepository) => { deck: ReturnType<typeof buildDefaultDeck>['deck'] }
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
