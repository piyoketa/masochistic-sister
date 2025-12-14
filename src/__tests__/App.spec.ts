import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as vuetifyComponents from 'vuetify/components'
import * as vuetifyDirectives from 'vuetify/directives'

describe('App', () => {
  it('RouterViewをスタブして描画できる', () => {
    const pinia = createPinia()
    const vuetify = createVuetify({
      components: vuetifyComponents,
      directives: vuetifyDirectives,
      icons: {
        defaultSet: 'mdi',
      },
    })

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
    })

    expect(wrapper.find('.router-view-stub').exists()).toBe(true)
  })
})
