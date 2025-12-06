import { describe, it, expect, beforeEach } from 'vitest'
import { reactive, nextTick } from 'vue'
import { useHandPresentation } from '@/components/battle/composables/useHandPresentation'
import { Card } from '@/domain/entities/Card'
import { Attack } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '@/domain/entities/cardTags'
import { StrengthState } from '@/domain/entities/states/StrengthState'
import { CorrosionState } from '@/domain/entities/states/CorrosionState'
import type { Enemy } from '@/domain/entities/Enemy'
import type { ViewManager } from '@/view/ViewManager'
import type { CardInfo } from '@/types/battle'

// テスト専用の攻撃カード。ターゲット選択が必要なシンプルな一回攻撃。
class TestAttack extends Attack {
  constructor() {
    super({
      name: 'テストアタック',
      baseDamage: new Damages({ baseAmount: 20, baseCount: 1, type: 'single' }),
      effectType: 'slash',
      cardDefinition: {
        title: 'テストアタック',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return 'テスト用の攻撃'
  }
}

describe('useHandPresentation ダメージ表示タイミング', () => {
  let card: Card
  let snapshot: any
  let viewManager: any
  let enemyStub: any

  beforeEach(() => {
    card = new Card({ action: new TestAttack() })
    card.assignId(1)
    enemyStub = {
      id: 1,
      getStates: () => [new CorrosionState(1)],
    } as unknown as Enemy
    viewManager = {
      battle: {
        player: {
          getStates: () => [new StrengthState(2)],
        },
        enemyTeam: {
          findEnemy: (id: number) => (id === 1 ? enemyStub : undefined),
        },
      },
    } as unknown as ViewManager
    snapshot = {
      id: 'battle',
      player: {
        id: 'player',
        name: 'プレイヤー',
        currentHp: 30,
        maxHp: 30,
        currentMana: 5,
        maxMana: 5,
        relics: [],
      },
      enemies: [],
      deck: [],
      hand: [card],
      discardPile: [],
      exilePile: [],
      events: [],
      turn: { turnCount: 1, activeSide: 'player', phase: 'player-draw' },
      log: [],
      status: 'in-progress',
    }
  })

  it('通常表示では補正なし、選択待ちでプレイヤー状態を反映し、敵ホバーで敵状態も反映する', async () => {
    const props = reactive({
      snapshot,
      hoveredEnemyId: null as number | null,
      viewManager,
    })
    const interactionState = reactive({
      selectedCardKey: null as string | null,
      isAwaitingEnemy: false,
    })
    const { handEntries } = useHandPresentation({ props, interactionState })

    // 手札通常表示: 補正なし
    const baseInfo = handEntries.value[0]?.info as Extract<CardInfo, { type: 'attack' }>
    expect(baseInfo.damageAmount).toBe(20)

    // 敵選択待ち開始でプレイヤーState（打点上昇+2）だけ反映
    interactionState.selectedCardKey = 'card-1'
    interactionState.isAwaitingEnemy = true
    await nextTick()
    const awaitingInfo = handEntries.value[0]?.info as Extract<CardInfo, { type: 'attack' }>
    expect(awaitingInfo.damageAmount).toBe(22)

    // 敵ホバーで敵State（腐食+10）も加算される
    props.hoveredEnemyId = 1
    await nextTick()
    const hoveredInfo = handEntries.value[0]?.info as Extract<CardInfo, { type: 'attack' }>
    expect(hoveredInfo.damageAmount).toBe(32)

    // キャンセル後は補正なし表示に戻る
    interactionState.isAwaitingEnemy = false
    interactionState.selectedCardKey = null
    props.hoveredEnemyId = null
    await nextTick()
    const resetInfo = handEntries.value[0]?.info as Extract<CardInfo, { type: 'attack' }>
    expect(resetInfo.damageAmount).toBe(20)
  })
})
