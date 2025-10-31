import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EncounterView from '../EncounterView.vue'

describe('EncounterView', () => {
  it('敵とカードの一覧を描画する', () => {
    const wrapper = mount(EncounterView, {
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

    expect(wrapper.findAll('.enemy-card-stub')).toHaveLength(4)
    expect(wrapper.findAll('.action-card-stub')).toHaveLength(20)
    expect(wrapper.html()).toContain('オーク')
    expect(wrapper.html()).toContain('第二階層・礼拝堂')
  })
})
