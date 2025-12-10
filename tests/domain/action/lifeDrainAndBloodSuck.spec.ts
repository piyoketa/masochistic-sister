import { describe, it, expect } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { Card } from '@/domain/entities/Card'
import { CardRepository } from '@/domain/repository/CardRepository'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { SnailTeam } from '@/domain/entities/enemyTeams'
import {
  LifeDrainSkillAction,
  BloodSuckAction,
  TackleAction,
  FlurryAction,
} from '@/domain/entities/actions'
import { Enemy } from '@/domain/entities/Enemy'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'

function createBattleWithHand(cards: Card[], deckCards: Card[] = [], repository: CardRepository = new CardRepository()): Battle {
  const player = new ProtagonistPlayer()
  const enemyTeam = new SnailTeam()

  const battle = new Battle({
    id: 'battle-life-drain',
    player,
    enemyTeam,
    deck: new Deck(deckCards),
    hand: new Hand(cards),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
    cardRepository: repository,
  })

  battle.startPlayerTurn()
  return battle
}

function requireId(card: Card): number {
  const id = card.id
  if (id === undefined) {
    throw new Error('カードにIDが割り当てられていません')
  }
  return id
}

describe('生命収奪とドレイン効果', () => {
  it('単撃カード以外を指定するとエラーになる', () => {
    const repository = new CardRepository()
    const lifeDrain = repository.create(() => new Card({ action: new LifeDrainSkillAction() }))
    const flurry = repository.create(() => new Card({ action: new FlurryAction() }))
    const battle = createBattleWithHand([lifeDrain, flurry], [], repository)

    const lifeDrainId = requireId(lifeDrain)
    const flurryId = requireId(flurry)

    expect(() =>
      battle.playCard(lifeDrainId, [{ type: 'select-hand-card', payload: flurryId }]),
    ).toThrow('選択できるのは[単撃]のカードのみです')
  })

  it('付与されたドレインは次の自分ターン開始時に解除される', () => {
    const repository = new CardRepository()
    const lifeDrain = repository.create(() => new Card({ action: new LifeDrainSkillAction() }))
    const tackle = repository.create(() => new Card({ action: new TackleAction() }))
    const battle = createBattleWithHand([lifeDrain, tackle], [], repository)

    const lifeDrainId = requireId(lifeDrain)
    const tackleId = requireId(tackle)

    battle.playCard(lifeDrainId, [{ type: 'select-hand-card', payload: tackleId }])

    expect((tackle.cardTags ?? []).some((tag) => tag.id === 'tag-drain')).toBe(true)
    const events = battle.events.list()
    expect(events).toHaveLength(1)
    expect(events[0]?.type).toBe('custom')

    battle.endPlayerTurn()
    battle.startEnemyTurn()
    battle.enemyTeam.endTurn()
    battle.startPlayerTurn()
    battle.resolveEvents()

    expect((tackle.cardTags ?? []).some((tag) => tag.id === 'tag-drain')).toBe(false)
  })

  it('ドレイン付与後の攻撃でプレイヤーが回復する', () => {
    const repository = new CardRepository()
    const lifeDrain = repository.create(() => new Card({ action: new LifeDrainSkillAction() }))
    const tackle = repository.create(() => new Card({ action: new TackleAction() }))
    const battle = createBattleWithHand([lifeDrain, tackle], [], repository)

    const lifeDrainId = requireId(lifeDrain)
    const tackleId = requireId(tackle)
    const targetEnemy = battle.enemyTeam.members[0]
    if (targetEnemy?.id === undefined) {
      throw new Error('テスト用の敵IDが取得できませんでした')
    }

    battle.player.takeDamage(40)
    const hpBefore = battle.player.currentHp

    battle.playCard(lifeDrainId, [{ type: 'select-hand-card', payload: tackleId }])
    battle.playCard(tackleId, [{ type: 'target-enemy', payload: targetEnemy.id }])

    expect(battle.player.currentHp).toBe(Math.min(battle.player.maxHp, hpBefore + 20))

    battle.endPlayerTurn()
    battle.startEnemyTurn()
    battle.enemyTeam.endTurn()
    battle.startPlayerTurn()
    battle.resolveEvents()

    expect((tackle.cardTags ?? []).some((tag) => tag.id === 'tag-drain')).toBe(false)
  })

  it('敵の口づけ攻撃でドレイン回復が発動する', () => {
    const player = new ProtagonistPlayer()
    const bloodSuck = new BloodSuckAction()
    const enemy = new Enemy({
      name: 'コウモリ',
      maxHp: 40,
      currentHp: 25,
      actions: [bloodSuck],
      image: '/assets/enemies/bat.jpg',
    })
    const enemyTeam = new EnemyTeam({
      id: 'enemy-drain-test',
      members: [enemy],
    })
    const battle = new Battle({
      id: 'battle-enemy-drain',
      player,
      enemyTeam,
      deck: new Deck([]),
      hand: new Hand([]),
      discardPile: new DiscardPile(),
      exilePile: new ExilePile(),
      events: new BattleEventQueue(),
      log: new BattleLog(),
      turn: new TurnManager(),
      cardRepository: new CardRepository(),
    })

    const hpBefore = enemy.currentHp
    const playerHpBefore = player.currentHp

    battle.startEnemyTurn()
    enemy.act(battle)

    expect(player.currentHp).toBe(playerHpBefore - 10)
    expect(enemy.currentHp).toBe(Math.min(enemy.maxHp, hpBefore + 10))
  })
})
