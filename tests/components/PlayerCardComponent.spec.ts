import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import PlayerCardComponent from '@/components/PlayerCardComponent.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'

const playerImageStub = defineComponent({
  name: 'PlayerImageComponent',
  props: {
    stateProgressCount: {
      type: Number,
      default: 1,
    },
    damageExpressions: {
      type: Array,
      default: () => [],
    },
    faceExpressionLevel: {
      type: Number,
      default: 0,
    },
  },
  template:
    '<div class="player-image-stub" :data-progress="stateProgressCount" :data-damage="damageExpressions.join(\",\")" :data-face="faceExpressionLevel"></div>',
})

const damageEffectsStub = defineComponent({
  name: 'DamageEffects',
  props: {
    outcomes: {
      type: Array,
      default: () => [],
    },
  },
  setup(_props, { expose }) {
    // PlayerCardComponent が play() を呼ぶため、ダミー実装を露出しておく。
    expose({ play: () => undefined })
    return {}
  },
  template: '<div class="damage-effects-stub"></div>',
})

const hpGaugeStub = defineComponent({
  name: 'HpGauge',
  props: {
    current: Number,
    max: Number,
    predicted: Number,
  },
  template: '<div class="hp-gauge-stub"></div>',
})

function createWrapper(outcomes: DamageOutcome[], overrides?: { stateProgressCount?: number; damageExpressions?: string[]; faceExpressionLevel?: number }) {
  return mount(PlayerCardComponent, {
    props: {
      preHp: { current: 30, max: 30 },
      postHp: { current: 30, max: 30 },
      outcomes,
      stateProgressCount: overrides?.stateProgressCount,
      damageExpressions: overrides?.damageExpressions,
      faceExpressionLevel: overrides?.faceExpressionLevel,
      show: true,
    },
    global: {
      stubs: {
        PlayerImageComponent: playerImageStub,
        DamageEffects: damageEffectsStub,
        HpGauge: hpGaugeStub,
        TransitionGroup: false,
      },
    },
  })
}

function readProgress(wrapper: ReturnType<typeof createWrapper>): number {
  return wrapper.getComponent({ name: 'PlayerImageComponent' }).props('stateProgressCount') as number
}

describe('PlayerCardComponent の表示パラメータ', () => {
  it('状態進行・ダメージ表現・表情差分を PlayerImageComponent に渡す', async () => {
    const wrapper = createWrapper([], {
      stateProgressCount: 4,
      damageExpressions: ['脚の傷_小'],
      faceExpressionLevel: 2,
    })

    await nextTick()

    expect(readProgress(wrapper)).toBe(4)
    expect(wrapper.getComponent({ name: 'PlayerImageComponent' }).props('damageExpressions')).toEqual(['脚の傷_小'])
    expect(wrapper.getComponent({ name: 'PlayerImageComponent' }).props('faceExpressionLevel')).toBe(2)
  })
})
