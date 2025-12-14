import { createMemoryHistory, createRouter } from 'vue-router'

// テスト時のrouter未注入警告を防ぐための最小限のRouterインスタンス
export function createTestingRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: { template: '<div />' },
      },
    ],
  })
}
