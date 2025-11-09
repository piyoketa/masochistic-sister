import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BattleView from '../BattleView.vue'
import { ViewManager } from '@/view/ViewManager'
import { createBattleSampleScenario } from '../../../tests/fixtures/battleSampleScenario'
import { TargetEnemyOperation } from '@/domain/entities/operations'

function createGlobalStubs() {
  return {
    GameLayout: {
      template: '<div class="game-layout-stub"><slot name="window" /><slot name="instructions" /></div>',
    },
    EnemyCard: {
      props: ['enemy', 'selectable', 'hovered', 'selected'],
      emits: ['hover-start', 'hover-end'],
      template: `
        <div
          class="enemy-card-stub"
          :data-selectable="selectable"
          :data-hovered="hovered"
          @mouseenter="$emit('hover-start')"
          @mouseleave="$emit('hover-end')"
        >
          {{ enemy.name }}
        </div>
      `,
    },
    ActionCard: {
      props: ['title', 'selected', 'disabled', 'affordable'],
      emits: ['hover-start', 'hover-end'],
      template: `
        <div
          class="action-card-stub"
          :data-selected="selected"
          :data-disabled="disabled"
          @mouseenter="$emit('hover-start')"
          @mouseleave="$emit('hover-end')"
        >
          {{ title }}
        </div>
      `,
    },
    HpGauge: {
      props: ['current', 'max'],
      template: '<div class="hp-gauge-stub">{{ current }} / {{ max }}</div>',
    },
  } as const
}

describe('BattleView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  const mountWithManager = (viewManager: ViewManager) =>
    mount(BattleView, {
      props: { viewManager },
      global: {
        stubs: createGlobalStubs(),
        plugins: [pinia],
      },
    })

  it('ViewManager 初期化後に敵と手札を描画する', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const wrapper = mountWithManager(viewManager)

    await flushPromises()

    const enemyCards = wrapper.findAll('.enemy-card-stub')
    const actionCards = wrapper.findAll('.action-card-stub')

    expect(enemyCards).toHaveLength(4)
    expect(actionCards).toHaveLength(5)
    expect(wrapper.html()).toContain('ターン')
    expect(wrapper.html()).toContain('対象にカーソルを合わせて操作を確認')
  })

  it('アニメーションの update-snapshot コマンドで表示を更新する', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const wrapper = mountWithManager(viewManager)

    await flushPromises()

    const result = scenario.replayer.run(scenario.steps.playMasochisticAuraOnSnail)
    viewManager.enqueueAnimation({
      entryIndex: scenario.steps.playMasochisticAuraOnSnail,
      commands: [
        {
          type: 'update-snapshot',
          snapshot: result.snapshot,
          resolvedEntry: result.lastEntry,
        },
      ],
      resolvedEntry: result.lastEntry,
    })

    await flushPromises()
    await flushPromises()

    expect(wrapper.get('.mana-pop__current').text()).toBe('2')
    expect(wrapper.get('.mana-pop__max').text()).toBe('3')
    expect(wrapper.html()).toContain('ターン')
  })

  it('アニメーション待機中はボタンが無効化され、終了後に有効化される', async () => {
    vi.useFakeTimers()

    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const wrapper = mountWithManager(viewManager)

    await flushPromises()

    const button = wrapper.get('.end-turn-button')
    expect(button.attributes('disabled')).toBeUndefined()

    viewManager.enqueueAnimation({
      entryIndex: scenario.steps.playMasochisticAuraOnSnail,
      commands: [{ type: 'wait', duration: 1000 }],
    })

    await flushPromises()
    expect(wrapper.get('.end-turn-button').attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(wrapper.get('.end-turn-button').attributes('disabled')).toBeUndefined()

    vi.useRealTimers()
  })

  it('ターン終了ボタンを押すと操作キューが増える', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const wrapper = mountWithManager(viewManager)

    await flushPromises()

    const button = wrapper.get('.end-turn-button')
    const initialLogLength = viewManager.state.actionLogLength
    await button.trigger('click')
    await flushPromises()

    expect(viewManager.state.input.queued).toHaveLength(0)
    expect(viewManager.state.actionLogLength).toBeGreaterThan(initialLogLength)
    expect(wrapper.html()).not.toContain('操作キュー')
  })

  it('カードにホバーするとフッターの指示が更新される', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const wrapper = mountWithManager(viewManager)

    await flushPromises()

    const card = wrapper.find('.action-card-stub')
    await card.trigger('mouseenter')
    expect(wrapper.html()).toContain('左クリック：使用　右クリック：詳細')

    await card.trigger('mouseleave')
    expect(wrapper.html()).toContain('対象にカーソルを合わせて操作を確認')
  })

  it('Retryボタンで戦闘を初期状態に戻す', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const wrapper = mountWithManager(viewManager)

    await flushPromises()
    const initialIndex = viewManager.state.executedIndex
    const expectedLength = initialIndex >= 0 ? initialIndex + 1 : 0

    viewManager.queuePlayerAction({ type: 'end-player-turn' })
    await flushPromises()
    expect(viewManager.state.executedIndex).toBeGreaterThan(initialIndex)

    const retryButton = wrapper.findAll('.header-button')[0]!
    expect(retryButton.attributes('disabled')).toBeUndefined()

    await retryButton.trigger('click')
    await flushPromises()

    expect(viewManager.state.executedIndex).toBe(initialIndex)
    expect(viewManager.state.actionLogLength).toBe(expectedLength)
  })

  it('一手戻すボタンで最後のプレイヤーアクションを巻き戻す', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const wrapper = mountWithManager(viewManager)

    await flushPromises()
    const initialIndex = viewManager.state.executedIndex

    viewManager.queuePlayerAction({ type: 'end-player-turn' })
    await flushPromises()
    expect(viewManager.state.executedIndex).toBeGreaterThan(initialIndex)

    const undoButton = wrapper.findAll('.header-button')[1]!
    expect(undoButton.attributes('disabled')).toBeUndefined()

    await undoButton.trigger('click')
    await flushPromises()

    expect(viewManager.state.executedIndex).toBe(initialIndex)
    expect(viewManager.state.actionLogLength).toBe(initialIndex >= 0 ? initialIndex + 1 : 0)
  })

  it('HPが0になるとゲームオーバーオーバーレイが表示される', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const wrapper = mountWithManager(viewManager)

    await flushPromises()

    viewManager.queuePlayerAction({ type: 'end-player-turn' })
    await flushPromises()

    const snapshot = viewManager.state.snapshot
    expect(snapshot).toBeTruthy()

    const updatedSnapshot = {
      ...snapshot!,
      player: { ...snapshot!.player, currentHp: 0 },
      status: 'gameover' as const,
    }

    viewManager.applyAnimationCommand({
      type: 'update-snapshot',
      snapshot: updatedSnapshot,
      resolvedEntry: viewManager.state.lastResolvedEntry,
    })

    await flushPromises()

    expect(wrapper.find('.battle-gameover-overlay').exists()).toBe(true)
    const [retryButton, undoButton] = wrapper.findAll('.header-button')
    expect(retryButton.attributes('disabled')).toBeUndefined()
    expect(undoButton.attributes('disabled')).toBeUndefined()
  })

  it('カードを選択し敵をクリックすると操作がキューに積まれる', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const queueSpy = vi.spyOn(viewManager, 'queuePlayerAction')

    const wrapper = mountWithManager(viewManager)

    await flushPromises()

    const snapshot = viewManager.state.snapshot
    expect(snapshot).toBeTruthy()
    const targetIndex = snapshot!.hand.findIndex((card) =>
      card.definition.operations?.includes(TargetEnemyOperation.TYPE),
    )
    expect(targetIndex).toBeGreaterThan(-1)

    const cardEl = wrapper.findAll('.action-card-stub')[targetIndex]!
    await cardEl.trigger('click')
    await flushPromises()

    expect(wrapper.html()).toContain('対象の敵を選択')
    expect(cardEl.attributes()['data-selected']).toBe('true')

    const enemyEl = wrapper.findAll('.enemy-card-stub')[0]!
    const enemyId = snapshot!.enemies[0]!.id
    await enemyEl.trigger('click')
    await flushPromises()

    expect(queueSpy).toHaveBeenCalledTimes(1)
    expect(queueSpy).toHaveBeenCalledWith({
      type: 'play-card',
      cardId: snapshot!.hand[targetIndex]!.id,
      operations: [{ type: TargetEnemyOperation.TYPE, payload: enemyId }],
    })
    expect(wrapper.html()).toContain('対象にカーソルを合わせて操作を確認')

    queueSpy.mockRestore()
  })

  it('敵選択中に右クリックするとカード選択がキャンセルされる', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      operationLog: scenario.operationLog,
      initialOperationIndex: -1,
    })

    const queueSpy = vi.spyOn(viewManager, 'queuePlayerAction')

    const wrapper = mountWithManager(viewManager)

    await flushPromises()

    const snapshot = viewManager.state.snapshot
    expect(snapshot).toBeTruthy()
    const targetIndex = snapshot!.hand.findIndex((card) =>
      card.definition.operations?.includes(TargetEnemyOperation.TYPE),
    )
    expect(targetIndex).toBeGreaterThan(-1)

    const cardEl = wrapper.findAll('.action-card-stub')[targetIndex]!
    await cardEl.trigger('click')
    await flushPromises()
    expect(wrapper.html()).toContain('対象の敵を選択')

    const layout = wrapper.find('.battle-layout')
    await layout.trigger('contextmenu')
    await flushPromises()

    expect(queueSpy).not.toHaveBeenCalled()
    expect(wrapper.html()).toContain('対象にカーソルを合わせて操作を確認')
    expect(cardEl.attributes()['data-selected']).toBe('false')

    queueSpy.mockRestore()
  })
})
