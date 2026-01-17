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
  },
  template: '<div class="player-image-stub" :data-progress="stateProgressCount"></div>',
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

function createWrapper(outcomes: DamageOutcome[]) {
  return mount(PlayerCardComponent, {
    props: {
      preHp: { current: 30, max: 30 },
      postHp: { current: 30, max: 30 },
      outcomes,
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

describe('PlayerCardComponent の状態進行イベント', () => {
  it('合計19ダメージでは状態進行が進まない', async () => {
    // 初期状態の進行度を観測するために、最小限のpropsでマウントする。
    const wrapper = createWrapper([])
    expect(readProgress(wrapper)).toBe(1)

    // 20未満のダメージでは進行度が変わらないことを確認する。
    await wrapper.setProps({
      outcomes: [{ damage: 19, effectType: 'normal' }],
    })
    await nextTick()

    expect(readProgress(wrapper)).toBe(1)
  })

  it('合計20ダメージで状態進行が進む', async () => {
    // 20以上のダメージで、進行度が1つ進むことを確認する。
    const wrapper = createWrapper([])
    expect(readProgress(wrapper)).toBe(1)

    await wrapper.setProps({
      outcomes: [{ damage: 20, effectType: 'normal' }],
    })
    await nextTick()

    expect(readProgress(wrapper)).toBe(2)
  })
})
