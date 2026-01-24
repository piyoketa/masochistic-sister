import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BattleView from '@/views/BattleView.vue'
import { ViewManager } from '@/view/ViewManager'
import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { CardRepository } from '@/domain/repository/CardRepository'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { TestEnemyTeam } from '@/domain/entities/enemyTeams'
import { buildTestDeck } from '@/domain/entities/decks/TestDeck'
import { AchievementProgressManager } from '@/domain/achievements/AchievementProgressManager'
import { TargetEnemyOperation } from '@/domain/entities/operations'
import { createTestingRouter } from '../../__helpers__/router'

let pinia: ReturnType<typeof createPinia>

function createBattleWithAchievementProgress(): Battle {
  const cardRepository = new CardRepository()
  const testDeck = buildTestDeck(cardRepository)
  return new Battle({
    id: 'battle-testcase1',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam: new TestEnemyTeam(),
    deck: new Deck(testDeck.deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
    relicIds: [],
    // 初戦の実績進行度を明示的に0から始めるため、空のManagerを注入する。
    achievementProgressManager: new AchievementProgressManager(),
  })
}

function createGlobalStubs() {
  return {
    GameLayout: {
      template: '<div class="game-layout-stub"><slot name="window" /><slot name="instructions" /></div>',
    },
    EnemyCard: {
      props: ['enemy', 'selectable', 'hovered', 'selected', 'selectionTheme'],
      emits: ['hover-start', 'hover-end'],
      template: `
        <div
          class="enemy-card-stub"
          :data-selectable="selectable"
          :data-hovered="hovered"
          :data-selection-theme="selectionTheme"
          @mouseenter="$emit('hover-start')"
          @mouseleave="$emit('hover-end')"
        >
          {{ enemy.name }}
        </div>
      `,
    },
    ActionCard: {
      props: [
        'title',
        'selected',
        'disabled',
        'affordable',
        'damageAmount',
        'damageCount',
        'variant',
        'selectionTheme',
      ],
      emits: ['hover-start', 'hover-end'],
      template: `
        <div
          class="action-card-stub"
          :data-selected="selected"
          :data-disabled="disabled"
          :data-selection-theme="selectionTheme"
          @mouseenter="$emit('hover-start')"
          @mouseleave="$emit('hover-end')"
        >
          {{ title }}
        </div>
      `,
    },
    PlayerImageComponent: {
      props: ['currentHp', 'maxHp', 'isSelectingEnemy', 'selectionTheme'],
      template: '<div class="player-image-stub"><slot /></div>',
    },
    DamageEffects: {
      props: ['outcomes'],
      setup(_props, { expose }) {
        // PlayerCardComponent から play() が呼ばれるため、ダミー関数を露出する。
        expose({ play: () => undefined })
        return {}
      },
      template: '<div class="damage-effects-stub"></div>',
    },
  } as const
}

describe('戦闘中の発話キュー', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('初戦の被虐のオーラ使用後、操作開始時に「これで戦える...」が表示される', async () => {
    vi.useFakeTimers()

    const viewManager = new ViewManager({
      createBattle: () => createBattleWithAchievementProgress(),
      initialOperationIndex: -1,
    })

    const wrapper = mount(BattleView, {
      props: { viewManager },
      global: {
        stubs: createGlobalStubs(),
        plugins: [pinia, createTestingRouter()],
      },
    })

    await flushPromises()
    // 初期演出の待機を進めて、操作入力が可能な状態まで到達させる。
    await vi.runAllTimersAsync()
    await flushPromises()

    const battle = viewManager.battle
    expect(battle).toBeTruthy()
    if (!battle) {
      vi.useRealTimers()
      return
    }
    // 初戦の前提: 被虐のオーラ使用回数が0から開始していることを確認する。
    const initialProgress = battle.achievementProgressManager?.exportProgress()
    expect(initialProgress?.masochisticAuraUsedCount).toBe(0)

    const auraCard = battle.hand.list().find((card) => card.title === '被虐のオーラ')
    expect(auraCard).toBeTruthy()
    if (!auraCard || auraCard.id === undefined) {
      vi.useRealTimers()
      return
    }

    const targetEnemy = battle.enemyTeam.members.find((enemy) => enemy.name === 'かたつむり')
    expect(targetEnemy?.id).toBeDefined()
    if (!targetEnemy?.id) {
      vi.useRealTimers()
      return
    }

    // 操作: 「被虐のオーラ」をかたつむりに使用する（カードプレイ + 敵選択の操作を模擬）。
    viewManager.queuePlayerAction({
      type: 'play-card',
      cardId: auraCard.id,
      operations: [
        {
          type: TargetEnemyOperation.TYPE,
          payload: targetEnemy.id,
        },
      ],
    })

    // アニメーション: 被虐のオーラの演出と敵即時行動の完了までタイマーを進める。
    // 入力ロック解除＝次の自分の操作開始タイミングで発話が出るため、その瞬間を待ち受ける。
    let speechFound = false
    for (let step = 0; step < 40; step += 1) {
      await vi.advanceTimersByTimeAsync(250)
      await flushPromises()
      const caption = wrapper.find('.player-card__caption')
      if (caption.exists() && caption.text().includes('これで戦える...')) {
        speechFound = true
        break
      }
    }

    expect(speechFound).toBe(true)

    vi.useRealTimers()
  })
})
