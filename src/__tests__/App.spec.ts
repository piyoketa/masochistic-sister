import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { createPinia } from 'pinia'
import 'vuetify/styles'
import { createTestingVuetify } from '../../tests/components/__helpers__/vuetify'

describe('App', () => {
  it('RouterViewをスタブして描画できる', () => {
    const pinia = createPinia()
    const vuetify = createTestingVuetify()

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, vuetify],
        stubs: {
          RouterView: {
            name: 'RouterView',
            template: '<div class="router-view-stub" />',
          },
          RouterLink: {
            name: 'RouterLink',
            template: '<a class="router-link-stub"><slot /></a>',
          },
        },
      },
      attachTo: document.body,
    })

    expect(wrapper.find('.router-view-stub').exists()).toBe(true)
  })
})
