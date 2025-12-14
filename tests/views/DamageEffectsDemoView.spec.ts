import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, type Ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import DamageEffectsDemoView from '@/views/DamageEffectsDemoView.vue'

const playMock = vi.fn()

class FakeAudio {
  src: string
  preload = 'auto'
  volume = 1
  currentTime = 0
  constructor(src: string) {
    this.src = src
  }
  play() {
    return Promise.resolve()
  }
  pause() {}
  addEventListener() {}
}

Object.defineProperty(globalThis, 'Audio', {
  value: FakeAudio,
})

vi.mock('@/components/DamageEffects.vue', () => {
  return {
    default: defineComponent({
      name: 'DamageEffects',
      props: {
        outcomes: {
          type: Array,
          required: true,
        },
      },
      setup(props, { expose }) {
        const isReady: Ref<boolean> = ref(true)
        expose({
          play: playMock,
          isReady,
        })
        return () =>
          h('div', {
            class: 'damage-effects-stub',
            'data-count': props.outcomes.length,
          })
      },
    }),
  }
})

describe('/demo/damage-effects', () => {
  it('renders scenarios and switches outcomes per effectType', async () => {
    setActivePinia(createPinia())
    const wrapper = mount(DamageEffectsDemoView)

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const stub = wrapper.find('.damage-effects-stub')
    expect(stub.exists()).toBe(true)
    expect(stub.attributes('data-count')).toBe('4') // default slash scenario

    const buttons = wrapper.findAll('.scenario-entry button')
    const spitButton = buttons.find((btn) => btn.text().includes('Spit / Acid'))
    expect(spitButton).toBeDefined()
    await spitButton!.trigger('click')

    await wrapper.vm.$nextTick()

    const updatedStub = wrapper.find('.damage-effects-stub')
    expect(updatedStub.attributes('data-count')).toBe('2') // spit scenario has 2 outcomes

    await wrapper.find('button.play-button').trigger('click')
  })
})
