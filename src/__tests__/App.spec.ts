import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('RouterViewをスタブして描画できる', () => {
    const wrapper = mount(App, {
      global: {
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
