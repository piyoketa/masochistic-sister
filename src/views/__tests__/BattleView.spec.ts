import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import BattleView from '../BattleView.vue'
import { ViewManager } from '@/view/ViewManager'
import { createBattleSampleScenario } from '../../../tests/fixtures/battleSampleScenario'

describe('BattleView', () => {
  it('ViewManager 初期化後に敵と手札を描画する', async () => {
    const scenario = createBattleSampleScenario()
    const viewManager = new ViewManager({
      createBattle: scenario.createBattle,
      actionLog: scenario.replayer.getActionLog(),
      initialActionLogIndex: scenario.steps.playerTurn1Start,
    })

    const wrapper = mount(BattleView, {
      props: {
        viewManager,
      },
      global: {
        stubs: {
          GameLayout: {
            template: '<div class="game-layout-stub"><slot name="window" /><slot name="instructions" /></div>',
          },
          EnemyCard: {
            props: ['enemy'],
            template: '<div class="enemy-card-stub">{{ enemy.name }}</div>',
          },
          ActionCard: {
            props: ['title'],
            template: '<div class="action-card-stub">{{ title }}</div>',
          },
          HpGauge: {
            props: ['current', 'max'],
            template: '<div class="hp-gauge-stub">{{ current }} / {{ max }}</div>',
          },
        },
      },
    })

    await flushPromises()

    const enemyCards = wrapper.findAll('.enemy-card-stub')
    const actionCards = wrapper.findAll('.action-card-stub')

    expect(enemyCards).toHaveLength(4)
    expect(actionCards).toHaveLength(5)
    expect(wrapper.html()).toContain('第二階層・礼拝堂')
    expect(wrapper.html()).toContain('ターン')
  })
})
