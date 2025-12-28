import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RelicIconDemoView from '@/views/RelicIconDemoView.vue'
import RelicList from '@/components/RelicList.vue'

// このテストはデモ画面でパッシブレリック発動時にglowクラスが付与されることを確認する。
describe('RelicIconDemoView', () => {
  it('RelicList単体でもパッシブ発動時にglowクラスが付与される', () => {
    const wrapper = mount(RelicList, {
      props: {
        relics: [
          {
            id: 'test-passive',
            name: 'パッシブ',
            usageType: 'passive',
            icon: '💤',
            description: 'test',
            active: true,
            usable: true,
            uiState: 'passive-active',
          },
        ],
      },
    })
    const button = wrapper.get('button')
    expect(button.attributes('data-ui-state')).toBe('passive-active')
    expect(button.attributes('data-active')).toBe('true')
    expect(button.classes(), `classes=${button.classes().join(',')}`).toContain('relic-icon--glow')
  })

  it('パッシブの発動条件を満たすとglowクラスが付与される', async () => {
    const wrapper = mount(RelicIconDemoView, {
      global: {
        // GameLayoutはスロットコンテナとしてだけ扱う
        stubs: {
          GameLayout: {
            template: '<div><slot name="window" /></div>',
          },
        },
      },
    })

    const passiveToggle = wrapper.find('input[type="checkbox"]')
    expect(passiveToggle.exists()).toBe(true)

    const passiveRelic = () => wrapper.find('button[aria-label="パッシブ（条件前/発動中）"]')
    expect(passiveRelic().classes()).not.toContain('relic-icon--glow')

    await passiveToggle.setValue(true)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const relicList = wrapper.findComponent({ name: 'RelicList' })
    const relicsProp = relicList.props('relics') as { id: string; uiState?: string; active: boolean }[]
    expect(relicsProp[1]?.uiState, `uiState after toggle: ${relicsProp[1]?.uiState}`).toBe('passive-active')
    expect(relicsProp[1]?.active, 'active flag should reflect toggle').toBe(true)

    const classesAfter = passiveRelic().classes()
    // デバッグ用にクラス配列を明示（テスト失敗時の出力強化）
    expect(passiveRelic().attributes('data-ui-state')).toBe('passive-active')
    expect(passiveRelic().attributes('data-active')).toBe('true')
    expect(classesAfter, `actual classes: ${classesAfter.join(',')}`).toContain('relic-icon--glow')
  })
})
