import { describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import StartStoryView from '@/views/StartStoryView.vue'
import { usePlayerDeckOverlayStore } from '@/stores/playerDeckOverlayStore'
import { usePileOverlayStore } from '@/stores/pileOverlayStore'

describe('/field/start-story', () => {
  async function mountStartStory() {
    const pinia = createPinia()
    setActivePinia(pinia)
    // 実ルートと同じ props 変換を付けて StartStoryView を表示できるようにする。
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/field/start-story',
          name: 'start-story',
          component: StartStoryView,
          props: (route) => ({ fieldId: (route.query.fieldId as string | undefined) ?? 'first-field' }),
        },
        {
          path: '/title',
          name: 'title',
          component: { template: '<div />' },
        },
      ],
    })

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
        // ヘッダーの挙動検証に不要なUIは軽量スタブで置き換える。
        stubs: {
          GameLayout: {
            template: '<div><slot name="window" /><slot name="instructions" /></div>',
          },
          PlayerCardComponent: {
            template: '<div class="player-card-stub" />',
          },
          CardList: {
            template: '<div class="card-list-stub" />',
          },
          Transition: false,
          TransitionGroup: false,
        },
      },
      attachTo: document.body,
    })

    // ルーティングで /field/start-story を表示し、ヘッダーが描画される状態へ進める。
    await router.push({ name: 'start-story', query: { fieldId: 'first-field' } })
    await router.isReady()
    await flushPromises()

    return { wrapper }
  }

  it('デッキボタンからデッキ一覧オーバーレイが開く', async () => {
    const { wrapper } = await mountStartStory()

    const playerDeckOverlayStore = usePlayerDeckOverlayStore()
    const pileOverlayStore = usePileOverlayStore()

    // 初期状態: デッキ一覧オーバーレイは未表示で、既存の山札/捨て札オーバーレイも開かない。
    expect(playerDeckOverlayStore.visible).toBe(false)
    expect(wrapper.find('.player-deck-overlay').exists()).toBe(false)
    expect(pileOverlayStore.activePile).toBe(null)

    // ヘッダーの「デッキ:x枚」ボタンをクリックする操作に対応する。
    const deckButton = wrapper.findAll('button').find((button) => button.text().includes('デッキ'))
    expect(deckButton, 'デッキボタンが見つからない場合はヘッダー表示を確認する').toBeTruthy()
    await deckButton!.trigger('click')
    await flushPromises()

    // クリック後: 新しいデッキ一覧オーバーレイが開き、既存の山札/捨て札オーバーレイは使われない。
    expect(playerDeckOverlayStore.visible).toBe(true)
    expect(wrapper.find('.player-deck-overlay').exists()).toBe(true)
    expect(wrapper.find('.player-deck-window__title').text()).toContain('デッキ一覧')
    expect(pileOverlayStore.activePile).toBe(null)

    wrapper.unmount()
  })

  it('レリックにhoverすると詳細オーバーレイが表示される', async () => {
    const { wrapper } = await mountStartStory()

    // 初期状態: レリック詳細オーバーレイが表示されていないことを確認する。
    expect(document.body.querySelector('.relic-card-overlay')).toBeNull()

    // ヘッダー内のレリックボタンにマウスオーバー操作を行う。
    const relicButton = wrapper.find('.relic-list .relic-icon')
    expect(relicButton.exists(), 'レリックボタンが見つからない場合は初期レリック設定を確認する').toBe(true)
    const relicName = relicButton.attributes('aria-label') ?? ''
    await relicButton.trigger('mouseenter')
    await flushPromises()

    // ホバー後: レリック詳細オーバーレイが表示され、名称が含まれる。
    const overlay = document.body.querySelector('.relic-card-overlay')
    expect(overlay).not.toBeNull()
    expect(overlay?.textContent ?? '', '詳細オーバーレイのテキストが空になっていないことを確認する').toContain(relicName)

    wrapper.unmount()
  })
})
